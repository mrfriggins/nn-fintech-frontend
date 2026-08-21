import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TransactionHub from "../TransactionHub";

describe("TransactionHub", () => {
  const syncData = vi.fn();

  beforeEach(() => {
    localStorage.setItem("token", "test-token");
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(window, "prompt").mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("submits a P2P transfer with the form values and token", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<TransactionHub syncData={syncData} />);

    await user.type(screen.getByPlaceholderText("Recipient Node Email"), "recipient@example.com");
    await user.type(screen.getByPlaceholderText("Amount (USD)"), "125.50");
    fireEvent.submit(document.querySelectorAll("form")[0]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8080/api/transfer/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({
          recipientEmail: "recipient@example.com",
          amount: "125.5",
        }),
      },
    );
    expect(window.alert).toHaveBeenCalledWith("TRANSFER SUCCESSFUL: Capital Moved.");
    expect(syncData).toHaveBeenCalledOnce();
  });

  it("alerts the server error and does not sync after a failed transfer", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Recipient not found" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<TransactionHub syncData={syncData} />);

    await user.type(screen.getByPlaceholderText("Recipient Node Email"), "missing@example.com");
    await user.type(screen.getByPlaceholderText("Amount (USD)"), "10");
    await user.click(screen.getByRole("button", { name: "Execute Transfer" }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("TRANSFER FAILED: Recipient not found"));
    expect(syncData).not.toHaveBeenCalled();
  });

  it("alerts a connection error when a transfer request rejects", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<TransactionHub syncData={syncData} />);

    await user.type(screen.getByPlaceholderText("Recipient Node Email"), "recipient@example.com");
    await user.type(screen.getByPlaceholderText("Amount (USD)"), "10");
    await user.click(screen.getByRole("button", { name: "Execute Transfer" }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("VAULT CONNECTION ERROR"));
    expect(syncData).not.toHaveBeenCalled();
  });

  it("does not fetch when the PayPal prompt is cancelled", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(window.prompt).mockReturnValue(null);
    render(<TransactionHub syncData={syncData} />);

    await user.type(screen.getByPlaceholderText("Amount to Withdraw (USD)"), "50");
    await user.click(screen.getByRole("button", { name: "Direct Payout" }));

    expect(window.prompt).toHaveBeenCalledWith("CRITICAL: Enter the PayPal Email to receive funds:");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits the withdrawal amount and PayPal email after confirmation", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Queued" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(window.prompt).mockReturnValue("payee@example.com");
    render(<TransactionHub syncData={syncData} />);

    await user.type(screen.getByPlaceholderText("Amount to Withdraw (USD)"), "75");
    await user.click(screen.getByRole("button", { name: "Direct Payout" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8080/api/withdraw/instant",
      expect.objectContaining({
        body: JSON.stringify({ amount: "75", paypalEmail: "payee@example.com" }),
      }),
    );
    expect(window.alert).toHaveBeenCalledWith("✅ LIQUIDITY DISBURSED: Queued");
    expect(syncData).toHaveBeenCalledOnce();
  });

  it("alerts the server error and does not sync after a failed withdrawal", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "PayPal account rejected" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(window.prompt).mockReturnValue("payee@example.com");
    render(<TransactionHub syncData={syncData} />);

    await user.type(screen.getByPlaceholderText("Amount to Withdraw (USD)"), "75");
    await user.click(screen.getByRole("button", { name: "Direct Payout" }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("❌ WITHDRAWAL REFUSED: PayPal account rejected"),
    );
    expect(syncData).not.toHaveBeenCalled();
  });

  it("alerts a connection error when a withdrawal request rejects", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    vi.mocked(window.prompt).mockReturnValue("payee@example.com");
    render(<TransactionHub syncData={syncData} />);

    await user.type(screen.getByPlaceholderText("Amount to Withdraw (USD)"), "75");
    await user.click(screen.getByRole("button", { name: "Direct Payout" }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("VAULT CONNECTION ERROR"));
    expect(syncData).not.toHaveBeenCalled();
  });

  it("disables both actions while a request is in flight", async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: unknown) => void = () => {};
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<TransactionHub syncData={syncData} />);

    await user.type(screen.getByPlaceholderText("Recipient Node Email"), "recipient@example.com");
    await user.type(screen.getByPlaceholderText("Amount (USD)"), "10");
    const transferButton = screen.getByRole("button", { name: "Execute Transfer" });
    const payoutButton = screen.getByRole("button", { name: "Direct Payout" });
    await user.click(transferButton);

    expect(transferButton).toBeDisabled();
    expect(payoutButton).toBeDisabled();
    resolveFetch({ ok: true, json: async () => ({}) });
    await waitFor(() => expect(transferButton).not.toBeDisabled());
  });
});
