"use client";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function TransactionsPage() {
  const [txs, setTxs] = useState([]);

  useEffect(() => {
    const fetchTxs = async () => {
      const res = await fetch("${API_URL}/api/account/transactions", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) setTxs(await res.json());
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