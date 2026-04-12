"use client";
import { useState } from "react";

export default function TransactionHub({ userBalance, syncData }: any) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [method, setMethod] = useState("M-Pesa"); // Default for Tanzania
  const [status, setStatus] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // --- 💸 PEER-TO-PEER TRANSFER ---
  const handleTransfer = async () => {
    setStatus("Processing Transfer...");
    const res = await fetch("http://127.0.0.1:8080/api/transfer/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ recipientEmail: recipient, amount })
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("✅ Transfer Complete!");
      syncData(); // Refresh balance
    } else {
      setStatus(`❌ Error: ${data.error}`);
    }
  };

  // --- 🏦 WITHDRAWAL REQUEST (KYC GUARDED) ---
  const handleWithdraw = async () => {
    setStatus("Logging Withdrawal...");
    const res = await fetch("http://127.0.0.1:8080/api/withdraw/request", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ amount, method, details: `Withdraw to ${method} account` })
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("✅ Request Sent! Awaiting Admin Approval.");
      syncData();
    } else {
      // This will catch the "KYC VERIFICATION REQUIRED" error from your backend
      setStatus(`❌ Denied: ${data.error}`);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 font-mono">
      {/* Transfer Card */}
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]">
        <h2 className="text-2xl font-black uppercase mb-4 italic">Send Capital</h2>
        <input 
          type="email" placeholder="Recipient Email" 
          className="w-full p-3 border-2 border-black mb-2 focus:bg-blue-50 outline-none"
          onChange={(e) => setRecipient(e.target.value)}
        />
        <input 
          type="number" placeholder="Amount ($)" 
          className="w-full p-3 border-2 border-black mb-4 focus:bg-blue-50 outline-none"
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={handleTransfer} className="w-full bg-blue-500 text-white font-black py-3 border-2 border-black hover:bg-blue-600 transition-colors uppercase">
          Execute Transfer
        </button>
      </div>

      {/* Withdraw Card */}
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(239,68,68,1)]">
        <h2 className="text-2xl font-black uppercase mb-4 italic">Request Exit</h2>
        <select 
          className="w-full p-3 border-2 border-black mb-2 outline-none"
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="M-Pesa">M-Pesa (Tanzania)</option>
          <option value="Airtel Money">Airtel Money</option>
          <option value="Bank">Bank Transfer</option>
        </select>
        <input 
          type="number" placeholder="Withdraw Amount ($)" 
          className="w-full p-3 border-2 border-black mb-4 focus:bg-red-50 outline-none"
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={handleWithdraw} className="w-full bg-red-500 text-white font-black py-3 border-2 border-black hover:bg-red-600 transition-colors uppercase">
          Request Payout
        </button>
      </div>

      {status && (
        <div className="md:col-span-2 bg-black text-white p-4 text-center font-black uppercase italic animate-pulse">
          {status}
        </div>
      )}
    </div>
  );
}