"use client";
import { useState } from "react";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/withdraw/instant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ amount, paypalEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("LIQUIDITY DISBURSED: Check your PayPal.");
        window.location.href = "/dashboard";
      } else {
        alert(`ERROR: ${data.error}`);
      }
    } catch (err) { alert("GATEWAY OFFLINE"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      <h1 className="text-2xl font-black uppercase mb-6">Withdraw Capital</h1>
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