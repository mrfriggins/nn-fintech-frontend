import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WithdrawPage from "../page";

describe("WithdrawPage", () => {
  let originalLocation: Location | undefined;

  beforeEach(() => {
    localStorage.setItem("token", "withdraw-token");
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalLocation) {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
        writable: true,
      });
      originalLocation = undefined;
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  async function fillForm() {
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Amount (USD)"), "250");
    await user.type(screen.getByPlaceholderText("PayPal Email"), "payee@example.com");
    await user.click(screen.getByRole("button", { name: "Execute Payout" }));
  }

  it("posts the withdrawal and navigates to the dashboard on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
    originalLocation = window.location;
    const locationSetter = vi.fn();
    const fakeLocation = {
      get href() {
        return "";
      },
      set href(value: string) {
        locationSetter(value);
      },
    };
    Object.defineProperty(window, "location", {
      configurable: true,
      value: fakeLocation,
      writable: true,
    });
    render(<WithdrawPage />);

    await fillForm();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/withdraw/instant",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer withdraw-token",
        },
        body: JSON.stringify({ amount: "250", paypalEmail: "payee@example.com" }),
      },
    );
    expect(window.alert).toHaveBeenCalledWith("LIQUIDITY DISBURSED: Check your PayPal.");
    expect(locationSetter).toHaveBeenCalledWith("/dashboard");
  });

  it("alerts the server error when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Daily limit exceeded" }),
      }),
    );
    render(<WithdrawPage />);

    await fillForm();

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("ERROR: Daily limit exceeded"));
  });

  it("alerts when the withdrawal request cannot connect", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<WithdrawPage />);

    await fillForm();

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("GATEWAY OFFLINE"));
  });
});
