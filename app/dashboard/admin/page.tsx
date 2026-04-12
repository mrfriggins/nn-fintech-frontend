"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function AdminHQ() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRev: 0, activeUsers: 0 });

  const fetchAdminData = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("${API_URL}/api/admin/all-transactions", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.status === 403) {
        alert("CRITICAL: Administrative Clearance Required.");
        router.push("/dashboard");
        return;
      }

      const data = await res.json();
      setLogs(data);

      const revenue = data.reduce((acc: number, log: any) => {
        // Absolute value for revenue tracking
        return (log.type.includes("LICENSE") || log.type.includes("PURCHASE")) ? acc + Math.abs(log.amount) : acc;
      }, 0);
      
      setStats({ totalRev: revenue, activeUsers: new Set(data.map((l: any) => l.userEmail)).size });
    } catch (err) {
      console.error("ADMIN LINK FAILURE");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdminData(); }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono text-[#00ff41]">
      <div className="animate-pulse tracking-[0.2em] font-black uppercase">Decrypting Ledger...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff41] p-6 font-mono selection:bg-[#00ff41] selection:text-black">
      
      {/* STATUS BAR */}
      <div className="flex justify-between items-center border-b-2 border-[#003b00] pb-4 mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest italic">NN-WATCHTOWER v3.0</h1>
          <p className="text-[10px] text-[#008f11] font-bold">SYSTEM STATUS: OPERATIONAL // CLEARANCE: ADMIN</p>
        </div>
        <button 
          onClick={() => router.push("/dashboard")}
          className="border border-[#00ff41] px-4 py-2 text-[10px] font-black hover:bg-[#00ff41] hover:text-black transition-all uppercase"
        >
          Back to Terminal
        </button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="border border-[#00ff41] p-6 bg-[#0d0d0d] shadow-[4px_4px_0px_0px_rgba(0,59,0,1)]">
          <p className="text-[10px] uppercase font-black text-[#008f11] mb-2">Gross Revenue (USDT)</p>
          <p className="text-4xl font-black text-white tracking-tighter">${stats.totalRev.toLocaleString()}</p>
        </div>
        <div className="border border-[#00ff41] p-6 bg-[#0d0d0d] shadow-[4px_4px_0px_0px_rgba(0,59,0,1)]">
          <p className="text-[10px] uppercase font-black text-[#008f11] mb-2">Total Node Connections</p>
          <p className="text-4xl font-black text-white tracking-tighter">{stats.activeUsers}</p>
        </div>
        <div className="border border-[#00ff41] p-6 bg-[#00ff41] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[10px] uppercase font-black mb-2">Network Security</p>
          <p className="text-4xl font-black tracking-tighter uppercase italic">Secure</p>
        </div>
      </div>

      {/* DATA TAPE */}
      <div className="border border-[#00ff41] bg-[#0d0d0d] shadow-[8px_8px_0px_0px_rgba(0,59,0,1)]">
        <div className="bg-[#003b00] text-[#00ff41] p-3 text-xs font-black uppercase tracking-widest flex justify-between">
          <span>Master Transaction Ledger</span>
          <span className="animate-pulse">● LIVE FEED</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-[#003b00] text-[#008f11]">
                <th className="p-4 uppercase">Timestamp</th>
                <th className="p-4 uppercase">User_Identity</th>
                <th className="p-4 uppercase">Event_Type</th>
                <th className="p-4 uppercase text-right">Credit/Debit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#003b00]/30">
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center opacity-50 uppercase tracking-widest">No Data Packets Found</td></tr>
              ) : logs.map((log, i) => (
                <tr key={i} className="hover:bg-[#00ff41]/5 transition-colors">
                  <td className="p-4 opacity-60 tabular-nums">{new Date(log.date).toLocaleString()}</td>
                  <td className="p-4 font-bold text-white">{log.userEmail}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-[#003b00] text-[9px] font-black rounded uppercase">
                      {log.type}
                    </span>
                  </td>
                  <td className={`p-4 font-black text-right tabular-nums ${log.amount < 0 ? 'text-white' : 'text-[#00ff41]'}`}>
                    {log.amount < 0 ? `-$${Math.abs(log.amount)}` : `+$${log.amount}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="mt-8 text-[9px] text-[#003b00] uppercase font-black flex justify-between">
        <span>NN-Fintech Multi-Billion Infrastructure</span>
        <span>Build: 2026.04.11-Admin</span>
      </footer>
    </div>
  );
}