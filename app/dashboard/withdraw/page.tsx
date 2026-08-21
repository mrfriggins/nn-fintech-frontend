"use client";
import { useState } from "react";
import { apiFetch, errorMessage, logError } from "../../lib/api";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid payout amount.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/withdraw/instant", {
        method: "POST",
        body: JSON.stringify({ amount: value, paypalEmail }),
      });
      alert("LIQUIDITY DISBURSED: Check your PayPal.");
      window.location.href = "/dashboard";
    } catch (err) {
      logError("instant withdrawal failed", err);
      setError(errorMessage(err, "Gateway offline. No funds were moved."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      <h1 className="text-2xl font-black uppercase mb-6">Withdraw Capital</h1>
      {error && (
        <p className="mb-4 bg-red-100 border-2 border-red-600 text-red-700 p-3 font-black uppercase text-[10px]">{error}</p>
      )}
      <form onSubmit={handleWithdraw} className="space-y-4">
        <input required type="number" placeholder="Amount (USD)" className="w-full p-3 border-2 border-black font-bold" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input required type="email" placeholder="PayPal Email" className="w-full p-3 border-2 border-black font-bold" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} />
        <button disabled={loading} className="w-full bg-red-600 text-white font-black py-4 uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all">
          {loading ? "PROCESSING..." : "Execute Payout"}
        </button>
      </form>
    </div>
  );
}