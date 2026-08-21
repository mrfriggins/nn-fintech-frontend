"use client";
import { useState, useEffect } from "react";
import { requestGet } from "@/app/lib/api";
import { formatTimestamp, formatUsdAmount, signColorClass } from "@/app/lib/formatting";

export default function TransactionsPage() {
  const [txs, setTxs] = useState<unknown[]>([]);

  useEffect(() => {
    const fetchTxs = async () => {
      const result = await requestGet("/api/account/transactions");
      if (result.ok) setTxs(result.data || []);
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
                <td className={`p-4 ${signColorClass(t.amount, 'text-green-600', 'text-red-600', true)}`}>
                  {t.amount >= 0 ? "+" : ""}${formatUsdAmount(t.amount, { absolute: true })}
                </td>
                <td className="p-4 text-zinc-400 text-xs">{formatTimestamp(t.date)}</td>
                <td className="p-4"><span className="bg-zinc-100 px-2 py-1 text-[10px] uppercase border border-black">{t.status || "COMPLETED"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}