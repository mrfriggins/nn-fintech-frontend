"use client";
import { useState, useEffect } from "react";
import { ApiRecord, apiFetchArray, errorMessage, logError, toNumber, toText } from "../../lib/api";

export default function TransactionsPage() {
  const [txs, setTxs] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        setTxs(await apiFetchArray<ApiRecord>("/api/account/transactions"));
        setError("");
      } catch (err) {
        logError("transaction ledger fetch failed", err);
        setError(errorMessage(err, "Could not load the activity ledger."));
      } finally {
        setLoading(false);
      }
    };
    fetchTxs();
  }, []);

  return (
    <div className="space-y-6 font-mono">
      <h1 className="text-3xl font-black uppercase border-b-4 border-black pb-2">Activity Ledger</h1>
      {error && (
        <div className="bg-red-100 border-4 border-red-600 text-red-700 p-4 font-black uppercase text-xs">
          {error}
        </div>
      )}
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black text-white text-xs uppercase">
            <tr>
              <th className="p-4">Type</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-zinc-200">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-xs font-black uppercase animate-pulse">Syncing ledger...</td></tr>
            ) : txs.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-xs font-black uppercase text-zinc-400">{error ? "Ledger unavailable" : "No activity recorded"}</td></tr>
            ) : txs.map((t, i) => {
              const amount = toNumber(t.amount);
              const date = new Date(toText(t.date));
              return (
              <tr key={i} className="font-bold text-sm">
                <td className="p-4 uppercase">{toText(t.type, "UNKNOWN")}</td>
                <td className={`p-4 ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {amount >= 0 ? "+" : ""}${Math.abs(amount).toLocaleString()}
                </td>
                <td className="p-4 text-zinc-400 text-xs">{Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()}</td>
                <td className="p-4"><span className="bg-zinc-100 px-2 py-1 text-[10px] uppercase border border-black">{toText(t.status) || "COMPLETED"}</span></td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
