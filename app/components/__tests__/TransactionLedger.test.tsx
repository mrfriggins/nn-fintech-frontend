import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TransactionLedger from "../TransactionLedger";

describe("TransactionLedger", () => {
  beforeEach(() => {
    localStorage.setItem("token", "ledger-token");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("shows a loading placeholder before the first response", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<TransactionLedger />);

    expect(screen.getByText("SYNCING VAULT...")).toBeInTheDocument();
    resolveFetch({ ok: true, json: async () => [] });
    await waitFor(() => expect(screen.queryByText("SYNCING VAULT...")).not.toBeInTheDocument());
  });

  it("renders the empty state when there is no activity", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    render(<TransactionLedger />);
    await waitFor(() => expect(screen.getByText("No node activity detected.")).toBeInTheDocument());
  });

  it("formats amounts and displays payout status badges", async () => {
    vi.setSystemTime(new Date("2025-01-02T12:00:00Z"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { type: "DEPOSIT", amount: 12.5, date: "2025-01-02T00:00:00Z", status: "AUTO-SUCCESS" },
          { type: "WITHDRAWAL", amount: -3, date: "2025-01-02T00:00:00Z", status: "PENDING_ADMIN" },
        ],
      }),
    );
    render(<TransactionLedger />);

    await waitFor(() => expect(screen.getByText("+12.50 USD")).toBeInTheDocument());
    expect(screen.getByText("-3.00 USD")).toBeInTheDocument();
    expect(screen.getByText("EXECUTED")).toBeInTheDocument();
    expect(screen.getByText("Awaiting Payout")).toBeInTheDocument();
    expect(screen.getByText("DEPOSIT")).toHaveClass("text-black");
  });

  it("resolves loading after a fetch failure without crashing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<TransactionLedger />);

    await waitFor(() => expect(screen.queryByText("SYNCING VAULT...")).not.toBeInTheDocument());
    expect(screen.getByText("No node activity detected.")).toBeInTheDocument();
  });

  it("polls every ten seconds and stops polling after unmount", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);
    window.fetch = fetchMock;
    const { unmount } = render(<TransactionLedger />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    unmount();
    await act(async () => {
      vi.advanceTimersByTime(20000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
