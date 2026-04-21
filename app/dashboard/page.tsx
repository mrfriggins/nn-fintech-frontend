"use client";
import React, { useState, useEffect } from "react";
import Ticker from "../components/Ticker";
import CandleChart from "../components/CandleChart";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const countries = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("Tanzania");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const [user, setUser] = useState<any>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [tradeAmount, setTradeAmount] = useState<number>(1000);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [inbuiltSignal, setInbuiltSignal] = useState<any>(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState<any>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) { setIsLoggedIn(false); setLoading(false); return; }
    try {
      const pRes = await fetch(`${API_URL}/api/users/profile`, { headers: { "Authorization": `Bearer ${token}` } });
      if (!pRes.ok) throw new Error("AUTH_FAIL");
      const profile = await pRes.json();
      setUser(profile);
      setIsLoggedIn(true);

      if (profile.subscriptionTier !== 'none' || profile.role === 'admin' || profile.email === 'nicholausdominic86@gmail.com') {
        const mRes = await fetch(`${API_URL}/api/market/stream`, { headers: { "Authorization": `Bearer ${token}` } });
        if (mRes.ok) {
            const data = await mRes.json();
            setStocks(data);
            if (!selectedAsset && data.length > 0) setSelectedAsset(data[0]);
        }
      }

      if ((profile.role === 'admin' || profile.email === 'nicholausdominic86@gmail.com') && activeTab === 'watchtower') {
          const uRes = await fetch(`${API_URL}/api/admin/users`, { headers: { "Authorization": `Bearer ${token}` } });
          if (uRes.ok) setAdminUsersList(await uRes.json());
          const tRes = await fetch(`${API_URL}/api/admin/all-transactions`, { headers: { "Authorization": `Bearer ${token}` } });
          if (tRes.ok) setAdminLogs(await tRes.json());
      }
    } catch (e) { localStorage.removeItem("token"); setIsLoggedIn(false); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 5000);
    return () => clearInterval(timer);
  }, [activeTab]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isVerifying ? "/auth/verify" : (authMode === "login" ? "/auth/login" : "/auth/register");
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, country, otp })
      });
      const data = await res.json();
      if (res.status === 201) { setIsVerifying(true); alert("CODE SENT."); return; }
      if (res.ok && data.token) { localStorage.setItem("token", data.token); window.location.reload(); }
      else alert(data.error || "Access Denied");
    } catch (err) { alert("Server Offline"); }
  };

  const openPosition = async (side: 'buy' | 'sell') => {
    if (!selectedAsset) return;
    try {
      await fetch(`${API_URL}/api/trade/execute`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ symbol: selectedAsset.symbol, amount: tradeAmount, side })
      });
      fetchData();
    } catch (e) {}
  };

  const getInbuiltPrediction = async () => {
    if (!selectedAsset) return;
    try {
      const res = await fetch(`${API_URL}/api/ai/inbuilt/predict/${encodeURIComponent(selectedAsset.symbol)}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (res.ok) setInbuiltSignal(data);
    } catch (e) {}
  };

  const runAI = async () => {
    if (!userQuestion) return;
    setIsAnalyzing(true); setAiAnalysis("Computing...");
    try {
      const res = await fetch(`${API_URL}/api/ai/openai/tutor`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ question: userQuestion, symbol: selectedAsset?.symbol })
      });
      const data = await res.json();
      if (res.ok) {
        let i = 0;
        const txt = data.tutorResponse;
        const interval = setInterval(() => {
          setAiAnalysis(txt.slice(0, i)); i++;
          if (i > txt.length) { clearInterval(interval); setIsAnalyzing(false); }
        }, 15);
      }
    } catch (e) { setIsAnalyzing(false); }
  };

  const purchase = async (tier: string) => {
    setIsCheckingOut(true);
    try {
      const res = await fetch(`${API_URL}/api/payment/create-invoice`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ tier })
      });
      const data = await res.json();
      if (res.ok) setCheckoutInfo(data);
    } catch (e) { alert("Gateway Error"); } finally { setIsCheckingOut(false); }
  };

  const handleBanUser = async (targetEmail: string) => {
    if (!confirm(`Are you sure you want to ban ${targetEmail}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/ban`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ targetEmail })
      });
      if (res.ok) fetchData();
    } catch (e) { alert("Error banning user."); }
  };

  if (loading) return <div className="bg-black min-h-screen text-[#00ff41] font-mono flex items-center justify-center animate-pulse">SYSTEM_BOOT_...</div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono p-4">
        <div className="w-full max-w-md bg-[#0d0d0d] border border-zinc-800 p-10 shadow-2xl">
          <h2 className="text-4xl font-black text-white uppercase italic mb-8 border-b border-[#00ff41] pb-2">{authMode}</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            {isVerifying ? (
              <input type="text" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-black border border-[#00ff41] p-4 text-[#00ff41] text-center text-2xl font-black outline-none" required />
            ) : (
              <>
                {authMode === "register" && <input type="text" placeholder="NAME" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white uppercase outline-none" required />}
                <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white uppercase outline-none" required />
                <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white uppercase outline-none" required />
              </>
            )}
            <button type="submit" className="w-full bg-[#00ff41] text-black font-black py-4 uppercase tracking-widest">Connect</button>
          </form>
          {!isVerifying && <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full mt-6 text-[10px] text-zinc-500 uppercase">Toggle Auth</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono flex flex-col overflow-hidden">
      <Ticker stocks={stocks} />
      <div className="flex flex-1 relative overflow-hidden">
        <aside className="w-72 bg-[#0d0d0d] border-r border-zinc-800 p-8 hidden md:flex flex-col">
          <h1 className="text-2xl font-black text-[#00ff41] italic uppercase mb-10">NN-Fintech</h1>
          <nav className="flex-1 space-y-4">
            {["overview", "terminal", "academy", "licenses"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-4 py-3 text-xs font-black uppercase ${activeTab === tab ? "bg-[#00ff41] text-black" : "text-zinc-500"}`}>{tab}</button>
            ))}
            {(user?.role === "admin" || user?.email === "nicholausdominic86@gmail.com") && (
              <button onClick={() => setActiveTab("watchtower")} className="w-full text-left px-4 py-3 text-xs font-black uppercase text-red-500 border border-red-900/30">Watchtower</button>
            )}
          </nav>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-auto border border-red-500/30 text-red-500 py-3 text-xs font-black uppercase">Terminate</button>
        </aside>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-[#0a0a0a]">
          <header className="flex justify-between items-end mb-8 border-b border-zinc-800 pb-8">
            <h2 className="text-5xl font-black uppercase italic tracking-tighter">{activeTab}</h2>
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-500 uppercase">Demo Balance</p>
              <p className="text-2xl font-black text-[#00ff41]">${Number(user?.demoBalance || 0).toLocaleString()}</p>
            </div>
          </header>

          {activeTab === "terminal" && (
            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[900px]">
              <div className="w-full lg:w-1/4 flex flex-col gap-4">
                <div className="flex-1 bg-[#0d0d0d] border border-zinc-800 p-4 overflow-y-auto max-h-[500px] lg:max-h-full scrollbar-hide">
                  <p className="text-[10px] font-black text-zinc-500 mb-4 border-b border-zinc-800 pb-2 uppercase tracking-widest">Market</p>
                  <div className="space-y-1">
                    {stocks.map(s => (
                      <div key={s.symbol} onClick={() => { setSelectedAsset(s); setInbuiltSignal(null); }} className={`p-3 cursor-pointer border-b border-zinc-900/30 flex justify-between items-center ${selectedAsset?.symbol === s.symbol ? 'bg-[#00ff41]/10 border-l-2 border-[#00ff41]' : ''}`}>
                        <span className="font-black text-white text-[11px]">{s.symbol}</span>
                        <p className={`text-[11px] font-mono font-black ${s.change?.includes('+') ? 'text-[#00ff41]' : 'text-red-500'}`}>${Number(s.price).toFixed(4)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#0d0d0d] border border-zinc-800 p-6">
                   <h3 className="text-zinc-600 font-black uppercase text-[10px] mb-4 tracking-widest border-b border-zinc-800 pb-2">Simulator</h3>
                   <input type="number" value={tradeAmount} onChange={(e) => setTradeAmount(Number(e.target.value))} className="w-full bg-black border border-zinc-800 text-[#00ff41] p-3 font-black outline-none text-xs mb-4" />
                   <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => openPosition('buy')} className="bg-[#00ff41] text-black font-black py-3 uppercase text-[10px]">Long</button>
                     <button onClick={() => openPosition('sell')} className="border border-red-500 text-red-500 font-black py-3 uppercase text-[10px]">Short</button>
                   </div>
                </div>
              </div>

              <div className="w-full lg:w-3/4 flex flex-col gap-4">
                <div className="bg-black border border-zinc-800 relative h-[650px] lg:h-[750px] w-full min-h-[600px]">
                  <div className="absolute top-4 left-4 z-10 bg-black/60 p-3 border border-zinc-800 backdrop-blur-md">
                     <span className="text-white font-black text-xs uppercase">{selectedAsset?.symbol || "SELECT"}</span>
                  </div>
                  <div className="w-full h-full p-2">
                    {selectedAsset ? <CandleChart symbol={selectedAsset.symbol} currentPrice={selectedAsset.price} /> : <div className="w-full h-full flex items-center justify-center text-zinc-800 text-xs">INIT_SYSTEM...</div>}
                  </div>
                </div>
                <div className="bg-[#0d0d0d] border border-zinc-800 p-8 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex-1">
                      <h3 className="text-[#00ff41] font-black uppercase text-[10px] mb-2 tracking-widest">Neural Signal</h3>
                      <p className="text-[10px] text-zinc-500 uppercase">Scanning {selectedAsset?.symbol} Liquidity.</p>
                    </div>
                    {inbuiltSignal ? (
                      <div className="flex gap-12 items-center">
                         <div className="text-center">
                            <p className="text-[8px] text-zinc-500 uppercase mb-1">Signal</p>
                            <p className={`text-3xl font-black uppercase ${inbuiltSignal?.signal?.includes('BUY') ? 'text-[#00ff41]' : 'text-red-500'}`}>{inbuiltSignal?.signal}</p>
                         </div>
                         <div className="text-center border-l border-zinc-800 pl-12">
                            <p className="text-[8px] text-zinc-500 uppercase mb-1">SMA (20)</p>
                            <p className="text-xl font-black text-white font-mono">${Number(inbuiltSignal?.movingAverage || 0).toFixed(4)}</p>
                         </div>
                      </div>
                    ) : <button onClick={getInbuiltPrediction} className="bg-zinc-900 border border-zinc-700 text-white font-black px-12 py-3 uppercase text-[10px]">Compute</button>}
                </div>
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stocks.map(s => (
                <div key={s.symbol} onClick={() => {setSelectedAsset(s); setActiveTab("terminal");}} className="bg-[#0f0f0f] border border-zinc-800 p-8 cursor-pointer hover:border-[#00ff41] transition-all">
                  <div className="flex justify-between mb-4 items-center">
                     <span className="text-xs font-black text-zinc-500">{s.symbol}</span>
                     <span className={`text-[10px] font-black px-2 py-1 bg-black border ${s.change?.includes('+') ? 'text-[#00ff41] border-[#00ff41]/20' : 'text-red-500 border-red-500/20'}`}>{s.change}</span>
                  </div>
                  <p className="text-3xl font-black tabular-nums tracking-tighter">${Number(s.price).toFixed(4)}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "academy" && (
            <div className="max-w-5xl bg-[#0d0d0d] border border-[#00ff41] p-10">
                <h3 className="text-2xl font-black text-white uppercase mb-4 tracking-tighter">Oracle Engine</h3>
                <div className="flex gap-4 mb-8">
                    <input type="text" value={userQuestion} onChange={(e) => setUserQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runAI()} placeholder="Inquire..." className="flex-1 bg-black border border-zinc-800 text-[#00ff41] p-4 text-xs font-mono outline-none" />
                    <button onClick={runAI} className="bg-[#00ff41] text-black px-10 font-black uppercase text-xs">Ask</button>
                </div>
                <div className="p-8 min-h-[300px] font-mono text-sm border border-zinc-800 text-white bg-black leading-relaxed">{aiAnalysis || "Ready for inquiry..."}</div>
            </div>
          )}

          {activeTab === "licenses" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl">
                <div className="p-12 border border-zinc-800 bg-[#0d0d0d] hover:border-[#00ff41] group">
                    <h3 className="text-2xl font-black text-white uppercase">Retail</h3>
                    <p className="text-4xl font-black text-[#00ff41] mt-4 italic">$20.00 <span className="text-xs text-zinc-600 not-italic">/ MO</span></p>
                    <button onClick={() => purchase("RETAIL")} className="bg-[#00ff41] text-black w-full mt-10 py-5 font-black uppercase">Activate</button>
                </div>
                <div className="p-12 border-4 border-yellow-500 bg-black">
                    <h3 className="text-2xl font-black text-yellow-500 uppercase">Institutional</h3>
                    <p className="text-4xl font-black text-white mt-4 italic">$500.00 <span className="text-xs text-zinc-600 not-italic">/ MO</span></p>
                    <button onClick={() => purchase("B2B")} className="bg-white text-black w-full mt-10 py-5 font-black uppercase">Provision</button>
                </div>
            </div>
          )}

          {activeTab === "watchtower" && (
            <div className="space-y-12">
                <div className="border border-red-900/50 bg-black">
                  <div className="p-6 bg-red-900/10 border-b border-red-900/50 text-red-500 font-black uppercase text-xs">Users</div>
                  <table className="w-full text-left text-xs text-white">
                    <thead><tr className="text-zinc-600 uppercase"><th className="p-4">Email</th><th className="p-4">Tier</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr></thead>
                    <tbody>{adminUsersList.map((u, i) => (<tr key={i} className="border-b border-zinc-900/30"><td className="p-4 font-bold">{u.email}</td><td className="p-4 uppercase text-[#00ff41]">{u.subscriptionTier}</td><td className="p-4 uppercase">{u.isActive ? "Active" : "Banned"}</td><td className="p-4 text-right"><button onClick={() => handleBanUser(u.email)} className="text-[9px] font-black uppercase text-red-500 border border-red-900/50 px-2 py-1">Kill Session</button></td></tr>))}</tbody>
                  </table>
                </div>
                <div className="border border-red-900/50 bg-black">
                  <div className="p-6 bg-red-900/10 border-b border-red-900/50 text-red-500 font-black uppercase text-xs">Ledger</div>
                  <table className="w-full text-left text-[11px] text-white">
                    <thead><tr className="text-zinc-600 uppercase"><th className="p-6">User</th><th className="p-6">Action</th><th className="p-6 text-right">USD</th></tr></thead>
                    <tbody>{adminLogs.map((log, i) => (<tr key={i} className="border-b border-zinc-900/30"><td className="p-6 font-bold">{log.userEmail}</td><td className="p-6 text-zinc-500 uppercase font-mono">{log.type}</td><td className={`p-6 text-right font-black ${Number(log.amount || 0) < 0 ? 'text-zinc-600' : 'text-[#00ff41]'}`}>{Number(log.amount || 0).toFixed(2)}</td></tr>))}</tbody>
                  </table>
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}