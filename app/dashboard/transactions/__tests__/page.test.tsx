import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TransactionsPage from "../page";

describe("TransactionsPage", () => {
  beforeEach(() => {
    localStorage.setItem("token", "transactions-token");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("renders fetched rows with localized absolute amounts and status defaults", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { type: "DEPOSIT", amount: 1234.5, date: "2025-01-02T00:00:00Z" },
        { type: "WITHDRAWAL", amount: -10, date: "2025-01-02T00:00:00Z", status: "PENDING_ADMIN" },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<TransactionsPage />);

    await waitFor(() => expect(screen.getByText("+$1,234.5")).toBeInTheDocument());
    expect(screen.getByText("+$1,234.5")).toHaveClass("text-green-600");
    expect(screen.getByText("$10")).toHaveClass("text-red-600");
    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
    expect(screen.getByText("PENDING_ADMIN")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/account/transactions",
      { headers: { Authorization: "Bearer transactions-token" } },
    );
  });

  it("leaves the table body empty for a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<TransactionsPage />);

    await waitFor(() => expect(screen.getByRole("columnheader", { name: "Type" })).toBeInTheDocument());
    expect(screen.getAllByRole("row")).toHaveLength(1);
    expect(screen.getByRole("table").querySelector("tbody")?.querySelectorAll("tr")).toHaveLength(0);
  });
});
