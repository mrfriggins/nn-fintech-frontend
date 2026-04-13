"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Ticker from "../components/Ticker";
import CandleChart from "../components/CandleChart";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export default function Dashboard() {
  const router = useRouter();

  // --- AUTH STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("Tanzania");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState("");

  // --- CORE SYSTEM STATES ---
  const [user, setUser] = useState<any>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [checkoutTier, setCheckoutTier] = useState<string | null>(null);
  const [txIdInput, setTxIdInput] = useState("");
  
  // --- TRADE STATES ---
  const [tradeAmount, setTradeAmount] = useState<number>(1000);
  const [tradeDuration, setTradeDuration] = useState<number>(60);
  const [takeProfit, setTakeProfit] = useState<number | "">(""); 
  const [stopLoss, setStopLoss] = useState<number | "">("");

  // --- AI STATES ---
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) { 
      setIsLoggedIn(false);
      setLoading(false); 
      return; 
    }

    try {
      const [pRes, mRes] = await Promise.all([
        fetch(`${API_URL}/api/users/profile`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${API_URL}/api/market/stocks`, { headers: { "Authorization": `Bearer ${token}` } }).catch(() => ({ json: () => [] }))
      ]);
      
      if (!pRes.ok) throw new Error("UNAUTHORIZED");

      const profile = await pRes.json();
      setUser(profile);
      setIsLoggedIn(true);
      
      let backendData = [];
      try { 
        const json = await mRes.json(); 
        backendData = Array.isArray(json) ? json : [];
      } catch(e) {}

      const dummyCommodities = [
        { symbol: "XAU/USD (GOLD)", price: 2385.40, change: "+1.2%", volatility: 0.0008 },
        { symbol: "WTI CRUDE", price: 82.55, change: "-0.5%", volatility: 0.002 }
      ];

      const combinedMarketData = [...backendData, ...dummyCommodities];
      setStocks(prev => prev.length === 0 ? combinedMarketData : prev);

      if (!selectedAsset && combinedMarketData.length > 0) setSelectedAsset(combinedMarketData[0]);

      if (profile.role === "admin") {
        const aRes = await fetch(`${API_URL}/api/admin/all-transactions`, { headers: { "Authorization": `Bearer ${token}` } });
        if (aRes.ok) setAdminLogs(await aRes.json());
      }
    } catch (e) { 
      localStorage.removeItem("token");
      setIsLoggedIn(false);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 10000); 
    return () => clearInterval(inv);
  }, []); // eslint-disable-line 

  useEffect(() => {
    if (stocks.length === 0) return;
    const tickInterval = setInterval(() => {
      setStocks(prev => prev.map(s => {
        const factor = s.volatility || 0.0005;
        const move = (Math.random() - 0.5) * (s.price * factor);
        return { ...s, price: s.price + move, change: `${move >= 0 ? '+' : '-'}${Math.abs((move / s.price) * 100).toFixed(2)}%` };
      }));
    }, 1000);
    return () => clearInterval(tickInterval);
  }, [stocks]);

  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (portfolio.length === 0 || stocks.length === 0) return;
    portfolio.forEach(position => {
      if (position.isClosing) return;
      const liveAsset = stocks.find(s => s.symbol === position.symbol);
      if (!liveAsset) return;

      const currentPrice = liveAsset.price;
      let triggerReason = null;

      if (currentTime >= position.expiresAt) triggerReason = "TIME EXPIRED";
      else if (position.side === 'buy') {
        if (position.tp && currentPrice >= position.tp) triggerReason = "TP HIT";
        if (position.sl && currentPrice <= position.sl) triggerReason = "SL HIT";
      } 
      else if (position.side === 'sell') {
        if (position.tp && currentPrice <= position.tp) triggerReason = "TP HIT";
        if (position.sl && currentPrice >= position.sl) triggerReason = "SL HIT";
      }

      if (triggerReason) {
        setPortfolio(prev => prev.map(p => p.id === position.id ? { ...p, isClosing: true } : p));
        liquidatePosition(position.id, triggerReason);
      }
    });
  }, [currentTime, portfolio, stocks]); // eslint-disable-line

  const liquidatePosition = async (contractId: string, reason = "MANUAL") => {
    const position = portfolio.find(p => p.id === contractId);
    if (!position) return;
    try {
      const res = await fetch(`${API_URL}/api/trade/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ symbol: position.symbol, amount: position.invested, side: position.side === 'buy' ? 'sell' : 'buy' }) 
      });
      if (res.ok) {
        setPortfolio(prev => prev.filter(p => p.id !== contractId));
        fetchData(); 
      }
    } catch (err) {}
  };

  const runQuantAI = (asset: any) => {
    setSelectedAsset(asset);
    setIsAnalyzing(true);
    setAiAnalysis("");
    const phrases = [`Analyzing ${asset.symbol} order flow... Dark pool accumulation detected.`, `Volatility expanding on ${asset.symbol}.`, `Macro data indicates supply squeeze for ${asset.symbol}.`];
    const targetText = phrases[Math.floor(Math.random() * phrases.length)];
    let i = 0;
    const interval = setInterval(() => {
      setAiAnalysis(targetText.slice(0, i)); i++;
      if (i > targetText.length) { clearInterval(interval); setIsAnalyzing(false); }
    }, 20);
  };

  const handleAuth = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    
    let endpoint = isVerifying ? "/auth/verify" : (authMode === "login" ? "/auth/login" : "/auth/register");
    const body = isVerifying 
      ? { email, otp } 
      : (authMode === "login" ? { email, password } : { email, password, fullName, country });

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();

      if (res.status === 201 || (res.ok && endpoint === "/auth/register")) {
        setIsVerifying(true);
        alert("AUTHORIZATION REQUIRED: Check your email or Render logs for the 6-digit access code.");
        return;
      }

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        setIsLoggedIn(true);
        window.location.reload(); 
      } else {
        alert(data.error || data.message || "IDENTIFICATION REJECTED");
      }
    } catch (err) {
      alert("GATEWAY ERROR: Backend non-responsive.");
    }
  };

  const openPosition = async (side: 'buy' | 'sell') => {
    if (!selectedAsset || !user) return;
    if (user.demoBalance < tradeAmount) return alert("INSUFFICIENT LIQUIDITY");

    try {
      const res = await fetch(`${API_URL}/api/trade/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ symbol: selectedAsset.symbol, amount: tradeAmount, side })
      });
      
      if (res.ok) {
        setPortfolio(prev => [...prev, {
          id: `ORD-${Date.now()}`, symbol: selectedAsset.symbol, side, invested: tradeAmount,
          qty: tradeAmount / selectedAsset.price, entryPrice: selectedAsset.price,
          expiresAt: Date.now() + (tradeDuration * 1000), tp: takeProfit ? Number(takeProfit) : null, sl: stopLoss ? Number(stopLoss) : null, isClosing: false
        }]);
        fetchData(); 
        setTakeProfit(""); setStopLoss("");
      }
    } catch (err) {}
  };

  if (loading) return (
    <div className="bg-[#050505] min-h-screen flex flex-col items-center justify-center text-[#00ff41] font-mono animate-pulse">
      <p className="text-xs font-black uppercase tracking-[0.5em]">Initializing Secure Node...</p>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono p-4">
        <div className="w-full max-w-md bg-[#0d0d0d] border border-zinc-800 p-10 shadow-[0_0_80px_rgba(0,0,0,1)] z-10 relative">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
              {isVerifying ? "Authorize" : (authMode === "login" ? "Identity" : "Create")}
            </h2>
            <div className="h-1 w-20 bg-[#00ff41] mx-auto mt-2"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isVerifying ? (
              <div className="space-y-3">
                <p className="text-[10px] text-zinc-500 uppercase font-black text-center">Enter 6-Digit Vault Key</p>
                <input type="text" placeholder="XXXXXX" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-black border border-[#00ff41] p-5 text-[#00ff41] text-center text-2xl font-black outline-none shadow-[0_0_15px_rgba(0,255,65,0.1)]" required />
              </div>
            ) : (
              <>
                {authMode === "register" && (
                  <>
                    <input type="text" placeholder="LEGAL FULL NAME" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white text-xs uppercase outline-none focus:border-[#00ff41]" required />
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white text-xs uppercase outline-none">
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </>
                )}
                <input type="email" placeholder="SECURE EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white text-xs uppercase outline-none focus:border-[#00ff41]" required />
                <input type="password" placeholder="ACCESS KEY" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white text-xs uppercase outline-none focus:border-[#00ff41]" required />
              </>
            )}
            
            <button type="submit" className="w-full bg-[#00ff41] text-black font-black py-5 uppercase tracking-widest mt-6 hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all">
              {isVerifying ? "Unlock Session" : (authMode === "login" ? "Enter Vault" : "Initialize Profile")}
            </button>
          </form>

          {!isVerifying && (
            <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full mt-10 text-[9px] text-zinc-500 uppercase font-black hover:text-[#00ff41] border-t border-zinc-800 pt-8 transition-colors">
              {authMode === "login" ? "Request New Credentials" : "Existing Operator Access"}
            </button>
          )}
          {isVerifying && (
            <button onClick={() => setIsVerifying(false)} className="w-full mt-6 text-[9px] text-red-500 uppercase font-black hover:underline tracking-widest">Abort Verification</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono flex flex-col overflow-hidden">
      <Ticker stocks={stocks} />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-[#0d0d0d] border-r border-zinc-800 p-8 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,1)]">
          <div className="mb-12">
            <h1 className="text-2xl font-black text-[#00ff41] italic tracking-tighter uppercase">NN-Fintech</h1>
            <div className="h-1 w-full bg-gradient-to-r from-[#00ff41] to-transparent mt-2"></div>
          </div>
          <nav className="flex-1 space-y-3">
            {["overview", "terminal", "licenses"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase transition-all ${activeTab === tab ? "bg-[#00ff41] text-black shadow-[0_0_15px_rgba(0,255,65,0.2)]" : "text-zinc-500 hover:text-[#00ff41]"}`}>{tab}</button>
            ))}
            {user?.role === "admin" && (
              <button onClick={() => setActiveTab("watchtower")} className={`w-full mt-12 text-left px-5 py-4 text-[10px] font-black uppercase transition-all border border-red-900/50 ${activeTab === "watchtower" ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]" : "text-red-500 hover:bg-red-900/20"}`}>Watchtower [ADMIN]</button>
            )}
          </nav>
          <div className="mt-auto p-5 bg-[#050505] border border-zinc-800 rounded-sm">
            <p className="text-[11px] font-bold truncate text-[#00ff41] mb-5 uppercase tracking-tighter">{user?.email}</p>
            <button onClick={() => { localStorage.removeItem("token"); window.location.reload(); }} className="w-full border border-red-500/50 text-red-500 py-3 text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">Terminate</button>
          </div>
        </aside>

        <main className="flex-1 p-10 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#051505] via-[#0a0a0a] to-[#0a0a0a]">
          <header className="flex justify-between items-end mb-12 border-b border-zinc-800 pb-10">
            <h2 className="text-6xl font-black uppercase italic tracking-tighter text-white">{activeTab}</h2>
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Simulated Liquidity</p>
              <p className="text-5xl font-black text-[#00ff41] tabular-nums tracking-tighter">${user?.demoBalance?.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
          </header>

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stocks.map(s => (
                <div key={s.symbol} onClick={() => {runQuantAI(s); setActiveTab("terminal");}} className="bg-[#0f0f0f] border border-zinc-800 p-8 hover:border-[#00ff41] transition-all cursor-pointer group">
                  <div className="flex justify-between mb-4">
                    <span className="text-xs font-black text-zinc-400 uppercase group-hover:text-white transition-colors">{s.symbol}</span>
                    <span className={`text-[10px] font-black ${s.change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>{s.change}</span>
                  </div>
                  <p className="text-4xl font-black text-white tracking-tighter tabular-nums">${s.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "terminal" && (
            <div className="flex gap-10 h-[800px]">
              <div className="w-1/4 bg-[#0d0d0d] border border-zinc-800 overflow-y-auto">
                <div className="p-5 bg-black border-b border-zinc-800 text-[10px] font-black uppercase text-zinc-500 sticky top-0 z-10">Live Assets</div>
                {stocks.map(s => (
                  <div key={s.symbol} onClick={() => runQuantAI(s)} className={`p-5 border-b border-zinc-800 cursor-pointer flex justify-between items-center transition-all ${selectedAsset?.symbol === s.symbol ? 'bg-[#00ff41]/10 border-l-8 border-l-[#00ff41]' : 'hover:bg-zinc-900'}`}>
                    <p className="font-black text-white text-[12px] uppercase">{s.symbol}</p>
                    <p className={`font-mono text-xs font-black ${s.change.includes('+') ? 'text-green-400' : 'text-red-400'}`}>${s.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="w-2/4 flex flex-col gap-8">
                <div className="bg-[#0d0d0d] border border-zinc-800 p-1 flex-1 relative min-h-[400px]">
                  {selectedAsset ? <CandleChart symbol={selectedAsset.symbol} currentPrice={selectedAsset.price} /> : <div className="text-zinc-700 flex items-center justify-center h-full text-xs font-black uppercase tracking-widest">Connect Stream...</div>}
                </div>

                <div className="h-64 bg-[#0d0d0d] border border-zinc-800 overflow-y-auto">
                   <div className="p-4 bg-black text-[10px] font-black uppercase text-zinc-500 sticky top-0 border-b border-zinc-800 z-10 flex justify-between">
                     <span>Active Contracts</span>
                     <span className="text-[#00ff41]">{portfolio.length} OPEN</span>
                   </div>
                   <table className="w-full text-left text-[11px]">
                     <thead><tr className="text-zinc-600 border-b border-zinc-800/50 uppercase"><th className="p-4">Asset</th><th className="p-4 text-center">Exposure</th><th className="p-4 text-right">Action</th></tr></thead>
                     <tbody>
                       {portfolio.map(p => (
                         <tr key={p.id} className="border-b border-zinc-900/50 hover:bg-zinc-900">
                           <td className="p-4"><p className="font-bold text-white text-[12px]">{p.symbol}</p><p className={`text-[9px] uppercase font-black ${p.side === 'buy' ? 'text-[#00ff41]' : 'text-red-500'}`}>{p.side}</p></td>
                           <td className="p-4 text-center font-black tabular-nums tracking-tighter">${p.invested.toLocaleString()}</td>
                           <td className="p-4 text-right"><button onClick={() => liquidatePosition(p.id)} disabled={p.isClosing} className="bg-red-900/30 border border-red-500 text-red-500 px-4 py-2 font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all">{p.isClosing ? "Closing..." : "Exit"}</button></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
              </div>

              <div className="w-1/4 flex flex-col gap-6">
                <div className="bg-[#0d0d0d] border border-zinc-800 p-6">
                  <h3 className="text-[#00ff41] font-black uppercase text-[10px] tracking-widest mb-4 flex items-center"><span className="w-2 h-2 bg-[#00ff41] rounded-full mr-2 animate-pulse"></span> Quant AI Core</h3>
                  <div className="bg-black border border-zinc-800 p-5 min-h-[120px] font-mono text-[11px] text-zinc-400 italic leading-relaxed">{aiAnalysis || "Awaiting Stream..."}</div>
                </div>

                <div className="flex-1 bg-[#0d0d0d] border border-zinc-800 p-8 flex flex-col">
                  {!user?.hasActiveSubscription ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <p className="text-red-500 text-[10px] font-black uppercase mb-4 tracking-widest">Execution Restricted</p>
                      <button onClick={() => setActiveTab("licenses")} className="text-[10px] font-black bg-red-600 text-white px-8 py-4 uppercase tracking-widest hover:bg-red-500">Go to Licenses</button>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full gap-6">
                      <div>
                        <label className="text-[10px] font-black text-zinc-600 uppercase mb-2 block">Risk Exposure (USDT)</label>
                        <input type="number" value={tradeAmount} onChange={(e) => setTradeAmount(Number(e.target.value))} className="w-full bg-black border border-zinc-800 text-white p-4 font-mono font-black text-lg outline-none focus:border-[#00ff41]" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[9px] font-black text-green-700 uppercase mb-1 block">TP-Zone</label>
                           <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value === "" ? "" : Number(e.target.value))} className="w-full bg-black border border-green-900/40 text-green-500 p-3 text-xs outline-none focus:border-green-500" />
                        </div>
                        <div>
                           <label className="text-[9px] font-black text-red-700 uppercase mb-1 block">SL-Zone</label>
                           <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value === "" ? "" : Number(e.target.value))} className="w-full bg-black border border-red-900/40 text-red-500 p-3 text-xs outline-none focus:border-red-500" />
                        </div>
                      </div>
                      <div className="mt-auto space-y-4 pt-10 border-t border-zinc-900">
                        <button onClick={() => openPosition('buy')} className="w-full bg-[#00ff41] text-black font-black py-6 uppercase tracking-[0.3em] hover:shadow-[0_0_30px_rgba(0,255,65,0.4)] transition-all">LONG</button>
                        <button onClick={() => openPosition('sell')} className="w-full border-2 border-red-500 text-red-500 font-black py-6 uppercase tracking-[0.3em] hover:bg-red-900/20">SHORT</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "licenses" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl animate-in slide-in-from-bottom-8">
              <div className="p-12 border border-zinc-800 bg-[#0d0d0d] hover:border-[#00ff41] transition-all group relative">
                <h3 className="text-3xl font-black uppercase text-white mb-4">Market Operator</h3>
                <p className="text-4xl font-black text-[#00ff41] mb-10 tracking-tighter italic">$20.00 <span className="text-xs text-zinc-600 not-italic uppercase tracking-widest">/ Retail</span></p>
                <button onClick={() => setCheckoutTier("RETAIL")} className="w-full bg-[#00ff41] text-black font-black py-5 uppercase tracking-widest group-hover:shadow-[0_0_25px_rgba(0,255,65,0.4)]">Activate Terminal</button>
              </div>

              <div className="p-12 border-4 border-yellow-500 bg-black relative shadow-[15px_15px_0_rgba(234,179,8,0.2)] hover:shadow-none transition-all">
                <h3 className="text-3xl font-black uppercase text-yellow-500 mb-4 tracking-widest">Institutional</h3>
                <p className="text-4xl font-black text-white mb-10 tracking-tighter italic">$500.00 <span className="text-xs text-zinc-600 not-italic uppercase tracking-widest">/ Enterprise</span></p>
                <button onClick={() => setCheckoutTier("B2B")} className="w-full bg-white text-black font-black py-5 uppercase tracking-widest hover:bg-yellow-500 transition-colors">Generate License</button>
              </div>
            </div>
          )}

          {activeTab === "watchtower" && (
            <div className="border border-red-900/50 bg-black overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.1)]">
              <div className="p-6 bg-red-900/20 border-b border-red-900/50 flex justify-between items-center">
                <h4 className="text-red-500 text-xs font-black uppercase tracking-widest">System Activity Protocol</h4>
                <span className="text-red-500 text-[10px] font-black animate-pulse uppercase">Security_Active</span>
              </div>
              <table className="w-full text-left text-[11px]">
                <thead><tr className="text-zinc-600 uppercase font-black border-b border-zinc-900"><th className="p-6">Operator</th><th className="p-6">Event</th><th className="p-6 text-right">Value (USDT)</th></tr></thead>
                <tbody>
                  {adminLogs.map((log, i) => (
                    <tr key={i} className="border-b border-zinc-900/50 hover:bg-red-900/10 transition-colors">
                      <td className="p-6 font-bold text-white uppercase">{log.userEmail}</td>
                      <td className="p-6 text-zinc-500 font-mono text-[9px] uppercase">{log.type}</td>
                      <td className={`p-6 text-right font-black tabular-nums ${log.amount < 0 ? 'text-zinc-600' : 'text-[#00ff41]'}`}>{log.amount?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {checkoutTier && (
        <div className="fixed inset-0 bg-black/98 flex items-center justify-center z-[100] p-6 backdrop-blur-xl">
          <div className="bg-[#0c0c0c] border border-[#00ff41] p-12 max-w-xl w-full shadow-[0_0_100px_rgba(0,255,65,0.2)]">
            <h2 className="text-3xl font-black uppercase mb-8 italic text-[#00ff41] tracking-tighter">Vault Gateway</h2>
            <div className="mb-10">
              <p className="text-[10px] font-bold mb-3 text-zinc-600 uppercase tracking-widest">Target: USDT (POLYGON)</p>
              <div className="bg-black p-5 border border-zinc-900 text-[11px] font-black text-[#00ff41] select-all break-all">0xYourPolygonWalletAddressHere</div>
            </div>
            <div className="space-y-6">
                <input type="text" placeholder="PASTE TXID (0X...)" value={txIdInput} onChange={(e) => setTxIdInput(e.target.value)} className="w-full p-5 border border-zinc-900 font-black uppercase bg-black text-white text-xs outline-none focus:border-[#00ff41] tracking-tighter" />
                <div className="flex gap-5">
                    <button onClick={() => setCheckoutTier(null)} className="flex-1 border border-zinc-800 py-5 font-black uppercase text-[10px] text-zinc-500 hover:text-white transition-colors">Abort</button>
                    <button className="flex-1 bg-[#00ff41] text-black py-5 font-black uppercase text-[10px] hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all">Verify TxID</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}