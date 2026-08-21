"use client";
import { useState, useEffect } from "react";
import { apiFetch, readJson } from "../../lib/api";

export default function TransactionsPage() {
  const [txs, setTxs] = useState<unknown[]>([]);

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        const res = await apiFetch("/api/account/transactions");
        const data = res.ok ? await readJson<unknown>(res) : null;
        setTxs(Array.isArray(data) ? data : []);
      } catch {
        setTxs([]);
      }
    };
    fetchTxs();
  }, []);

  return (
    <div className="space-y-6 font-mono">
      <h1 className="text-3xl font-black uppercase border-b-4 border-black pb-2">Activity Ledger</h1>
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
            {txs.map((t: any, i: number) => (
              <tr key={i} className="font-bold text-sm">
                <td className="p-4 uppercase">{t.type}</td>
                <td className={`p-4 ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toLocaleString()}
                </td>
                <td className="p-4 text-zinc-400 text-xs">{new Date(t.date).toLocaleString()}</td>
                <td className="p-4"><span className="bg-zinc-100 px-2 py-1 text-[10px] uppercase border border-black">{t.status || "COMPLETED"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}