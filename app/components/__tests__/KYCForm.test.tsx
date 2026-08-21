import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import KYCForm from "../KYCForm";

describe("KYCForm", () => {
  beforeEach(() => {
    localStorage.setItem("token", "kyc-token");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("renders nothing for verified users", () => {
    const { container } = render(<KYCForm kycStatus="VERIFIED" onStatusUpdate={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the in-progress notice for submitted users", () => {
    render(<KYCForm kycStatus="SUBMITTED" onStatusUpdate={vi.fn()} />);
    expect(screen.getByText("Status: Verification in Progress. Withdrawals Restricted.")).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("renders and submits the form for other statuses", async () => {
    const user = userEvent.setup();
    const onStatusUpdate = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    render(<KYCForm kycStatus="PENDING" onStatusUpdate={onStatusUpdate} />);

    await user.type(screen.getByPlaceholderText("Full Legal Name"), "Ada Lovelace");
    await user.type(screen.getByPlaceholderText("NIDA / ID Number"), "ID-123");
    await user.type(screen.getByPlaceholderText("Phone Number (+255...)"), "+255700000000");
    await user.type(screen.getByPlaceholderText("ID Image URL (Cloud Link)"), "https://example.com/id.png");
    await user.click(screen.getByRole("button", { name: "Certify My Identity" }));

    await waitFor(() => expect(onStatusUpdate).toHaveBeenCalledWith("SUBMITTED"));
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8080/api/kyc/submit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer kyc-token",
        },
        body: JSON.stringify({
          fullName: "Ada Lovelace",
          idNumber: "ID-123",
          phoneNumber: "+255700000000",
          documentUrl: "https://example.com/id.png",
        }),
      },
    );
    expect(screen.getByText("✅ Identity Submitted. Awaiting Admin Review.")).toBeInTheDocument();
  });

  it("shows the failure message without updating status for a non-ok response", async () => {
    const user = userEvent.setup();
    const onStatusUpdate = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<KYCForm kycStatus="PENDING" onStatusUpdate={onStatusUpdate} />);

    await user.type(screen.getByPlaceholderText("Full Legal Name"), "Ada Lovelace");
    await user.type(screen.getByPlaceholderText("NIDA / ID Number"), "ID-123");
    await user.type(screen.getByPlaceholderText("Phone Number (+255...)"), "+255700000000");
    await user.type(screen.getByPlaceholderText("ID Image URL (Cloud Link)"), "https://example.com/id.png");
    await user.click(screen.getByRole("button", { name: "Certify My Identity" }));

    await waitFor(() => expect(screen.getByText("❌ Submission Failed. Check all fields.")).toBeInTheDocument());
    expect(onStatusUpdate).not.toHaveBeenCalled();
  });

  it("shows a connection error when submission rejects", async () => {
    const user = userEvent.setup();
    const onStatusUpdate = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<KYCForm kycStatus="PENDING" onStatusUpdate={onStatusUpdate} />);

    await user.type(screen.getByPlaceholderText("Full Legal Name"), "Ada Lovelace");
    await user.type(screen.getByPlaceholderText("NIDA / ID Number"), "ID-123");
    await user.type(screen.getByPlaceholderText("Phone Number (+255...)"), "+255700000000");
    await user.type(screen.getByPlaceholderText("ID Image URL (Cloud Link)"), "https://example.com/id.png");
    await user.click(screen.getByRole("button", { name: "Certify My Identity" }));

    await waitFor(() => expect(screen.getByText("❌ Vault Connection Error.")).toBeInTheDocument());
    expect(onStatusUpdate).not.toHaveBeenCalled();
  });
});
