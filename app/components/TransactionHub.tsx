"use client";
import { useState } from "react";
import { apiJson, readJson } from "../lib/api";
import { isValidEmail, parseAmount } from "../lib/validation";

export default function TransactionHub({ syncData }: any) {
  const [transferData, setTransferData] = useState({ email: "", amount: "" });
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // --- 1. THE AUTOMATED P2P TRANSFER ---
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseAmount(transferData.amount);
    if (!amount) return alert("TRANSFER FAILED: Enter a valid amount.");
    if (!isValidEmail(transferData.email)) return alert("TRANSFER FAILED: Enter a valid recipient email.");

    setLoading(true);
    try {
      const res = await apiJson("/api/transfer/send", {
        recipientEmail: transferData.email.trim(),
        amount,
      });

      const data = await readJson(res);
      if (res.ok) {
        alert("TRANSFER SUCCESSFUL: Capital Moved.");
        syncData();
      } else {
        alert(`TRANSFER FAILED: ${data?.error ?? "Request rejected."}`);
      }
    } catch (err) {
      alert("VAULT CONNECTION ERROR");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. THE NEW INSTANT PAYOUT (DIRECT TO PAYPAL) ---
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseAmount(withdrawAmount);
    if (!amount) return alert("❌ WITHDRAWAL REFUSED: Enter a valid amount.");

    const paypalEmail = prompt("CRITICAL: Enter the PayPal Email to receive funds:");
    if (!paypalEmail) return;
    if (!isValidEmail(paypalEmail)) return alert("❌ WITHDRAWAL REFUSED: Invalid PayPal email.");

    setLoading(true);
    try {
      const res = await apiJson("/api/withdraw/instant", {
        amount,
        paypalEmail: paypalEmail.trim(),
      });

      const data = await readJson(res);
      if (res.ok) {
        alert(`✅ LIQUIDITY DISBURSED: ${data?.message ?? "Payout queued."}`);
        syncData();
      } else {
        alert(`❌ WITHDRAWAL REFUSED: ${data?.error ?? "Request rejected."}`);
      }
    } catch (err) {
      alert("VAULT CONNECTION ERROR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {/* TRANSFER BOX */}
      <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-black uppercase italic text-xl mb-4 border-b-2 border-black">P2P Node Transfer</h3>
        <form onSubmit={handleTransfer} className="space-y-4">
          <input
            required
            type="email"
            placeholder="Recipient Node Email"
            className="w-full p-2 border-2 border-black font-bold outline-none focus:bg-yellow-50"
            onChange={(e) => setTransferData({ ...transferData, email: e.target.value })}
          />
          <input
            required
            type="number"
            placeholder="Amount (USD)"
            className="w-full p-2 border-2 border-black font-bold outline-none focus:bg-yellow-50"
            onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
          />
          <button 
            disabled={loading}
            className="w-full bg-black text-white font-black py-2 uppercase hover:bg-zinc-800 transition-all"
          >
            {loading ? "TRANSMITTING..." : "Execute Transfer"}
          </button>
        </form>
      </div>

      {/* WITHDRAW BOX */}
      <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-black uppercase italic text-xl mb-4 border-b-2 border-black">Instant Liquidation</h3>
        <form onSubmit={handleWithdraw} className="space-y-4">
          <input
            required
            type="number"
            placeholder="Amount to Withdraw (USD)"
            className="w-full p-2 border-2 border-black font-bold outline-none focus:bg-green-50"
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <button 
            disabled={loading}
            className="w-full bg-green-500 text-black border-2 border-black font-black py-2 uppercase hover:bg-green-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            {loading ? "AUTHORIZING..." : "Direct Payout"}
          </button>
          <p className="text-[10px] font-bold text-zinc-500 text-center uppercase italic">
            Instant Processing • $500 Daily Limit
          </p>
        </form>
      </div>
    </div>
  );
}