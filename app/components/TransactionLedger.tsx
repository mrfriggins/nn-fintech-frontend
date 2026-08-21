"use client";
import { useEffect, useState } from "react";
import { ApiRecord, apiFetchArray, errorMessage, logError, toNumber, toText } from "../lib/api";

export default function TransactionLedger() {
  const [transactions, setTransactions] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLedger = async () => {
    try {
      setTransactions(await apiFetchArray<ApiRecord>("/api/account/transactions"));
      setError("");
    } catch (err) {
      logError("ledger sync failed", err);
      setError(errorMessage(err, "Ledger sync failure."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
    const interval = setInterval(fetchLedger, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="animate-pulse font-black text-xs">SYNCING VAULT...</p>;

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] max-h-[500px] overflow-y-auto font-mono">
      <h2 className="text-2xl font-black uppercase italic border-b-4 border-black mb-4 pb-2">Activity Logs</h2>

      {error && (
        <p className="mb-4 bg-red-100 border-2 border-red-600 text-red-700 p-3 font-black uppercase text-[10px]">{error}</p>
      )}
      
      <div className="space-y-4">
        {transactions.length === 0 ? (
            <p className="text-gray-400 italic text-sm">{error ? "Ledger unavailable." : "No node activity detected."}</p>
        ) : (
          transactions.map((tx, i) => {
            const type = toText(tx.type, "UNKNOWN");
            const amount = toNumber(tx.amount);
            const date = new Date(toText(tx.date));
            return (
            <div key={i} className="flex justify-between items-center border-b-2 border-zinc-100 pb-2">
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase ${type.includes('AI') ? 'text-blue-600' : 'text-black'}`}>
                  {type}
                </span>
                <span className="text-[9px] text-gray-400 uppercase">
                  {Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()}
                </span>
              </div>
              
              <div className="text-right">
                <span className={`text-sm font-black ${amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {amount > 0 ? '+' : ''}{amount.toFixed(2)} USD
                </span>
                
                {/* BACKEND STATUS HANDSHAKE */}
                {tx.status === "PENDING_ADMIN" && (
                  <div className="mt-1">
                    <span className="bg-yellow-400 text-[8px] px-2 py-0.5 font-bold uppercase animate-pulse">
                      Awaiting Payout
                    </span>
                  </div>
                )}
                {tx.status === "AUTO-SUCCESS" && (
                    <span className="text-[8px] text-green-400 font-bold block">EXECUTED</span>
                )}
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}