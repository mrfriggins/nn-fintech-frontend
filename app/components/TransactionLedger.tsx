"use client";
import { useState } from "react";
import { requestGet } from "@/app/lib/api";
import { formatTimestamp, formatUsdAmount, signColorClass } from "@/app/lib/formatting";
import { usePolling } from "@/app/lib/polling";

export default function TransactionLedger() {
  const [transactions, setTransactions] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedger = async () => {
    try {
      const result = await requestGet("/api/account/transactions");
      setTransactions(result.data || []);
    } catch (err) {
      console.error("Ledger Sync Failure");
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchLedger, 10000, []);

  if (loading) return <p className="animate-pulse font-black text-xs">SYNCING VAULT...</p>;

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] max-h-[500px] overflow-y-auto font-mono">
      <h2 className="text-2xl font-black uppercase italic border-b-4 border-black mb-4 pb-2">Activity Logs</h2>
      
      <div className="space-y-4">
        {transactions.length === 0 ? (
            <p className="text-gray-400 italic text-sm">No node activity detected.</p>
        ) : (
          transactions.map((tx: any, i: number) => (
            <div key={i} className="flex justify-between items-center border-b-2 border-zinc-100 pb-2">
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase ${tx.type.includes('AI') ? 'text-blue-600' : 'text-black'}`}>
                  {tx.type}
                </span>
                <span className="text-[9px] text-gray-400 uppercase">
                  {formatTimestamp(tx.date)}
                </span>
              </div>
              
              <div className="text-right">
                <span className={`text-sm font-black ${signColorClass(tx.amount, 'text-green-500', 'text-red-500')}`}>
                  {tx.amount > 0 ? "+" : ""}{formatUsdAmount(tx.amount, { grouping: false })} USD
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
          ))
        )}
      </div>
    </div>
  );
}