"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Ticker from "../components/Ticker";
import CandleChart from "../components/CandleChart";

// THE MASTER ROUTER
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ISO 3166 GLOBAL COUNTRY LIST
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

  // ==========================================
  // 1. AUTHENTICATION & VERIFICATION STATES
  // ==========================================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("Tanzania");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState("");

  // ==========================================
  // 2. CORE DASHBOARD & MARKET STATES
  // ==========================================
  const [user, setUser] = useState<any>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Time & Execution
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [checkoutTier, setCheckoutTier] = useState<string | null>(null);
  const [txIdInput, setTxIdInput] = useState("");
  
  // Risk Management
  const [tradeAmount, setTradeAmount] = useState<number>(1000);
  const [tradeDuration, setTradeDuration] = useState<number>(60);
  const [takeProfit, setTakeProfit] = useState<number | "">(""); 
  const [stopLoss, setStopLoss] = useState<number | "">("");

  // AI Analysis
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ==========================================
  // 3. DATA REFRESH & SESSION SECURITY
  // ==========================================
  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) { 
      setIsLoggedIn(false);
      setLoading(false); 
      return; 
    }

    try {
      const [pRes, mRes] = await Promise.all([
        fetch(`${API_URL}/api/users/profile`, { 
            headers: { "Authorization": `Bearer ${token}` } 
        }),
        fetch(`${API_URL}/api/market/stocks`, { 
            headers: { "Authorization": `Bearer ${token}` } 
        }).catch(() => ({ json: () => [] }))
      ]);
      
      if (!pRes.ok) throw new Error("UNAUTHORIZED_SESSION");

      const profile = await pRes.json();
      setUser(profile);
      setIsLoggedIn(true);
      
      let backendData = [];
      try { 
        const json = await mRes.json();
        backendData = Array.isArray(json) ? json : [];
      } catch(e) { backendData = []; }

      // Dummy High-Liquidity Commodities
      const dummyAssets = [
        { symbol: "XAU/USD (GOLD)", price: 2385.40, change: "+1.2%", volatility: 0.001 },
        { symbol: "WTI CRUDE", price: 82.55, change: "-0.5%", volatility: 0.002 },
        { symbol: "NATURAL GAS", price: 2.15, change: "+4.1%", volatility: 0.005 }
      ];

      const combined = [...backendData, ...dummyAssets];
      setStocks(prev => prev.length === 0 ? combined : prev);

      if (!selectedAsset && combined.length > 0) setSelectedAsset(combined[0]);

      if (profile.role === "admin") {
        const aRes = await fetch(`${API_URL}/api/admin/all-transactions`, { 
            headers: { "Authorization": `Bearer ${token}` } 
        });
        if (aRes.ok) setAdminLogs(await aRes.json());
      }
    } catch (e) { 
      console.warn("SESSION INVALIDATED");
      localStorage.removeItem("token");
      setIsLoggedIn(false);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); 
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // 4. MARKET SIMULATION ENGINE (CLIENT-SIDE)
  // ==========================================
  useEffect(() => {
    if (stocks.length === 0) return;
    const tick = setInterval(() => {
      setStocks(prev => prev.map(s => {
        const factor = s.volatility || 0.0005;
        const move = (Math.random() - 0.5) * (s.price * factor);
        const newPrice = s.price + move;
        return { 
            ...s, 
            price: newPrice, 
            change: `${move >= 0 ? '+' : '-'}${Math.abs((move / s.price) * 100).toFixed(2)}%` 
        };
      }));
    }, 1000);
    return () => clearInterval(tick);
  }, [stocks]);

  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);

  // ==========================================
  // 5. OMNI-DIRECTIONAL RISK PROTECTOR
  // ==========================================
  useEffect(() => {
    if (portfolio.length === 0 || stocks.length === 0) return;
    
    portfolio.forEach(pos => {
      if (pos.isClosing) return;
      const live = stocks.find(s => s.symbol === pos.symbol);
      if (!live) return;

      const price = live.price;
      let reason = null;

      if (currentTime >= pos.expiresAt) reason = "EXPIRY REACHED";
      else if (pos.side === 'buy') {
        if (pos.tp && price >= pos.tp) reason = "TP TARGET SECURED";
        if (pos.sl && price <= pos.sl) reason = "SL STOP HIT";
      } else if (pos.side === 'sell') {
        if (pos.tp && price <= pos.tp) reason = "TP TARGET SECURED";
        if (pos.sl && price >= pos.sl) reason = "SL STOP HIT";
      }

      if (reason) {
        setPortfolio(prev => prev.map(p => p.id === pos.id ? { ...p, isClosing: true } : p));
        liquidatePosition(pos.id, reason);
      }
    });
  }, [currentTime, portfolio, stocks]);

  // ==========================================
  // 6. QUANT AI ANALYTICS
  // ==========================================
  const runQuantAI = (asset: any) => {
    setSelectedAsset(asset);
    setIsAnalyzing(true);
    setAiAnalysis("");
    
    const insights = [
      `Analyzing ${asset.symbol} dark pool liquidity... Bullish divergence confirmed on M15.`,
      `Macro headwind detected for ${asset.symbol}. Resistance at psychological level. Caution advised.`,
      `Order flow for ${asset.symbol} shows institutional accumulation. High probability of upward sweep.`,
      `Volatility contraction in ${asset.symbol}. Anticipating breakout. Momentum: NEUTRAL.`
    ];
    const text = insights[Math.floor(Math.random() * insights.length)];
    
    let char = 0;
    const type = setInterval(() => {
      setAiAnalysis(text.slice(0, char));
      char++;
      if (char > text.length) { 
        clearInterval(type); 
        setIsAnalyzing(false); 
      }
    }, 25);
  };

  // ==========================================
  // 7. TRANSACTION & TRADE EXECUTION
  // ==========================================
  const openPosition = async (side: 'buy' | 'sell') => {
    if (!selectedAsset || !user) return;
    if (user.demoBalance < tradeAmount) return alert("INSUFFICIENT MARGIN");

    try {
      const res = await fetch(`${API_URL}/api/trade/execute`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ symbol: selectedAsset.symbol, amount: tradeAmount, side })
      });
      
      if (res.ok) {
        const contract = {
          id: `ORD-${Date.now()}`,
          symbol: selectedAsset.symbol,
          side,
          invested: tradeAmount,
          qty: tradeAmount / selectedAsset.price,
          entryPrice: selectedAsset.price,
          expiresAt: Date.now() + (tradeDuration * 1000), 
          tp: takeProfit || null,
          sl: stopLoss || null,
          isClosing: false
        };
        setPortfolio(prev => [...prev, contract]);
        fetchData();
        setTakeProfit(""); setStopLoss("");
      } else {
        const errData = await res.json();
        alert(errData.error || "ORDER REJECTED");
      }
    } catch (err) { alert("GATEWAY TIMEOUT"); }
  };

  const liquidatePosition = async (id: string, reason = "MANUAL EXIT") => {
    const pos = portfolio.find(p => p.id === id);
    if (!pos) return;
    try {
      const res = await fetch(`${API_URL}/api/trade/execute`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ 
            symbol: pos.symbol, 
            amount: pos.invested, 
            side: pos.side === 'buy' ? 'sell' : 'buy' 
        }) 
      });
      if (res.ok) {
        setPortfolio(prev => prev.filter(p => p.id !== id));
        fetchData(); 
        console.log(`Contract Closed: ${reason}`);
      }
    } catch (err) { console.error("LIQUIDATION FAILURE"); }
  };

  // ==========================================
  // 8. AUTHENTICATION & HANDSHAKE (ZERO-CRASH)
  // ==========================================
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    let endpoint = isVerifying ? "/auth/verify" : (authMode === "login" ? "/auth/login" : "/auth/register");
    const payload = isVerifying 
        ? { email, otp } 
        : (authMode === "login" ? { email, password } : { email, password, fullName, country });

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();

      if (res.ok) {
        if (endpoint === "/auth/register") {
          setIsVerifying(true);
          alert("SECURITY: 6-digit code dispatched to your inbox.");
        } else {
          localStorage.setItem("token", data.token);
          setIsLoggedIn(true);
          window.location.reload(); 
        }
      } else {
        alert(data.error || "ACCESS DENIED");
      }
    } catch (err) { alert("NETWORK ERROR: Check Backend Port."); }
  };

  if (loading) return (
    <div className="bg-[#050505] min-h-screen flex items-center justify-center text-[#00ff41] font-mono text-xs uppercase animate-pulse">
        Initializing NN-Fintech Secure Node...
    </div>
  );

  // ==========================================
  // 9. UI: AUTHENTICATION GATE
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono p-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <div className="w-full max-w-md bg-[#0d0d0d] border border-zinc-800 p-10 relative z-10 shadow-[0_0_50px_rgba(0,0,0,1)]">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                {isVerifying ? "Authorize" : (authMode === "login" ? "Identity" : "Register")}
            </h2>
            <p className="text-[#00ff41] text-[9px] font-black uppercase tracking-[0.3em] mt-1">NN-Fintech Global Vault</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isVerifying ? (
              <div className="space-y-3">
                <p className="text-[10px] text-zinc-500 uppercase font-black text-center">Enter Private Access Code</p>
                <input type="text" placeholder="XXXXXX" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-black border border-[#00ff41] p-5 text-[#00ff41] text-center text-2xl font-black outline-none shadow-[0_0_15px_rgba(0,255,65,0.1)]" required />
              </div>
            ) : (
              <>
                {authMode === "register" && (
                  <>
                    <input type="text" placeholder="LEGAL FULL NAME" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white text-xs uppercase outline-none focus:border-[#00ff41]" required />
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white text-xs uppercase outline-none focus:border-[#00ff41]">
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </>
                )}
                <input type="email" placeholder="SECURE EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white text-xs uppercase outline-none focus:border-[#00ff41]" required />
                <input type="password" placeholder="ACCESS KEY" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white text-xs uppercase outline-none focus:border-[#00ff41]" required />
              </>
            )}
            <button type="submit" className="w-full bg-[#00ff41] text-black font-black py-5 uppercase tracking-widest mt-6 hover:shadow-[0_0_20px_rgba(0,255,65,0.3)] transition-all">
                {isVerifying ? "Unlock Session" : (authMode === "login" ? "Enter Vault" : "Create Operator")}
            </button>
          </form>

          {!isVerifying && (
            <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full mt-10 text-[9px] text-zinc-500 uppercase font-black hover:text-[#00ff41] border-t border-zinc-800 pt-8 transition-colors">
              {authMode === "login" ? "Request New Credentials" : "Existing Operator Login"}
            </button>
          )}
          {isVerifying && (
            <button onClick={() => setIsVerifying(false)} className="w-full mt-6 text-[9px] text-red-500 uppercase font-black hover:underline tracking-widest">Abort Verification</button>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // 10. UI: MAIN TERMINAL (THE BILLIONAIRE SUITE)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono flex flex-col overflow-hidden">
      <Ticker stocks={stocks} />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT NAV: THE COMMAND CENTER */}
        <aside className="w-72 bg-[#0d0d0d] border-r border-zinc-800 p-8 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,1)]">
          <div className="mb-12">
            <h1 className="text-2xl font-black text-[#00ff41] italic tracking-tighter uppercase">NN-Fintech</h1>
            <div className="h-1 w-full bg-gradient-to-r from-[#00ff41] to-transparent mt-2"></div>
          </div>

          <nav className="flex-1 space-y-3">
            {["overview", "terminal", "licenses"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase transition-all ${activeTab === tab ? "bg-[#00ff41] text-black shadow-[0_0_20px_rgba(0,255,65,0.2)]" : "text-zinc-500 hover:text-[#00ff41]"}`}>{tab}</button>
            ))}
            {user?.role === "admin" && (
              <button onClick={() => setActiveTab("watchtower")} className={`w-full mt-12 text-left px-5 py-4 text-[10px] font-black uppercase transition-all border border-red-900/50 ${activeTab === "watchtower" ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]" : "text-red-500 hover:bg-red-900/20"}`}>Watchtower [ADMIN]</button>
            )}
          </nav>

          <div className="mt-auto p-5 bg-[#050505] border border-zinc-800 rounded-sm">
            <p className="text-[9px] text-zinc-600 uppercase font-black mb-1 tracking-tighter">Active Operator</p>
            <p className="text-[11px] font-bold truncate text-[#00ff41] mb-5 uppercase tracking-tighter">{user?.email}</p>
            <button onClick={() => { localStorage.removeItem("token"); window.location.reload(); }} className="w-full border border-red-500/50 text-red-500 py-3 text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">Terminate</button>
          </div>
        </aside>

        {/* MAIN DISPLAY: REAL-TIME DATA */}
        <main className="flex-1 p-10 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#051505] via-[#0a0a0a] to-[#0a0a0a]">
          <header className="flex justify-between items-end mb-12 border-b border-zinc-800 pb-10">
            <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Global Market Access</p>
                <h2 className="text-6xl font-black uppercase italic tracking-tighter text-white">{activeTab}</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Simulated Equity</p>
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
              <div className="w-1/4 bg-[#0d0d0d] border border-zinc-800 overflow-y-auto custom-scrollbar">
                <div className="p-5 bg-black border-b border-zinc-800 text-[10px] font-black uppercase text-zinc-500 sticky top-0 z-10">Global Liquidity</div>
                {stocks.map(s => (
                  <div key={s.symbol} onClick={() => runQuantAI(s)} className={`p-5 border-b border-zinc-800 cursor-pointer flex justify-between items-center transition-all ${selectedAsset?.symbol === s.symbol ? 'bg-[#00ff41]/10 border-l-8 border-l-[#00ff41]' : 'hover:bg-zinc-900'}`}>
                    <p className="font-black text-white text-[12px] uppercase">{s.symbol}</p>
                    <p className={`font-mono text-xs font-black ${s.change.includes('+') ? 'text-green-400' : 'text-red-400'}`}>${s.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="w-2/4 flex flex-col gap-8">
                <div className="bg-[#0d0d0d] border border-zinc-800 p-1 flex-1 relative">
                  {selectedAsset ? <CandleChart symbol={selectedAsset.symbol} currentPrice={selectedAsset.price} /> : <div className="text-zinc-700 flex items-center justify-center h-full text-xs font-black uppercase tracking-widest">Connect Asset To Stream...</div>}
                </div>

                <div className="h-64 bg-[#0d0d0d] border border-zinc-800 overflow-y-auto">
                   <div className="p-4 bg-black text-[10px] font-black uppercase text-zinc-500 sticky top-0 border-b border-zinc-800 z-10 flex justify-between">
                     <span>Open Positions</span>
                     <span className="text-[#00ff41]">{portfolio.length} ACTIVE</span>
                   </div>
                   <table className="w-full text-left text-[11px]">
                     <thead><tr className="text-zinc-600 border-b border-zinc-800/50 uppercase"><th className="p-4">Asset</th><th className="p-4 text-center">Exposure</th><th className="p-4 text-right">Action</th></tr></thead>
                     <tbody>
                       {portfolio.map(p => (
                         <tr key={p.id} className="border-b border-zinc-900/50 hover:bg-zinc-900 transition-colors">
                           <td className="p-4"><p className="font-bold text-white text-[12px]">{p.symbol}</p><p className={`text-[9px] uppercase font-black ${p.side === 'buy' ? 'text-[#00ff41]' : 'text-red-500'}`}>{p.side}</p></td>
                           <td className="p-4 text-center font-black tabular-nums tracking-tighter">${p.invested.toLocaleString()}</td>
                           <td className="p-4 text-right"><button onClick={() => liquidatePosition(p.id)} disabled={p.isClosing} className="bg-red-900/30 border border-red-500 text-red-500 px-4 py-2 font-black text-[10px] uppercase transition-all hover:bg-red-600 hover:text-white">{p.isClosing ? "Closing..." : "Exit"}</button></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
              </div>

              <div className="w-1/4 flex flex-col gap-6">
                <div className="bg-[#0d0d0d] border border-zinc-800 p-6">
                  <h3 className="text-[#00ff41] font-black uppercase text-[10px] tracking-widest mb-4 flex items-center"><span className="w-2 h-2 bg-[#00ff41] rounded-full mr-2 animate-pulse"></span> Quant AI Core</h3>
                  <div className="bg-black border border-zinc-800 p-5 min-h-[120px] font-mono text-[11px] text-zinc-400 shadow-inner italic leading-relaxed">{aiAnalysis || "Awaiting Data Stream..."}</div>
                </div>

                <div className="flex-1 bg-[#0d0d0d] border border-zinc-800 p-8">
                  {!user?.hasActiveSubscription ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <p className="text-red-500 text-xs font-black uppercase mb-4 tracking-[0.2em]">Execution Access Restricted</p>
                      <button onClick={() => setActiveTab("licenses")} className="text-[10px] font-black bg-red-600 text-white px-8 py-4 uppercase tracking-widest hover:bg-red-500">Acquire License</button>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full gap-6">
                      <div className="flex flex-col gap-4">
                        <label className="text-[10px] font-black text-zinc-600 uppercase">Risk Value (USDT)</label>
                        <input type="number" value={tradeAmount} onChange={(e) => setTradeAmount(Number(e.target.value))} className="w-full bg-black border border-zinc-800 text-white p-4 font-mono font-black text-lg outline-none focus:border-[#00ff41]" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-green-700 uppercase">TP-Zone</label>
                           <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value === "" ? "" : Number(e.target.value))} className="w-full bg-black border border-green-900/40 text-green-500 p-3 text-xs outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-red-700 uppercase">SL-Zone</label>
                           <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value === "" ? "" : Number(e.target.value))} className="w-full bg-black border border-red-900/40 text-red-500 p-3 text-xs outline-none" />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl animate-in fade-in slide-in-from-bottom-6">
              <div className="p-12 border border-zinc-800 bg-[#0d0d0d] hover:border-[#00ff41] transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 font-black text-[10px] text-zinc-800 uppercase italic">Retail_v2.0</div>
                <h3 className="text-3xl font-black uppercase text-white mb-4">Market Operator</h3>
                <p className="text-4xl font-black text-[#00ff41] mb-10 tracking-tighter italic">$20.00 <span className="text-xs text-zinc-600 not-italic uppercase tracking-widest">/ One-time</span></p>
                <ul className="text-[11px] text-zinc-500 font-black uppercase space-y-4 mb-12">
                   <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-[#00ff41]"></span> Unlimited Simulated Trading</li>
                   <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-[#00ff41]"></span> Standard AI Quant Core</li>
                   <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-[#00ff41]"></span> Global Market Ticker Feed</li>
                </ul>
                <button onClick={() => setCheckoutTier("RETAIL")} className="w-full bg-[#00ff41] text-black font-black py-5 uppercase tracking-widest group-hover:shadow-[0_0_25px_rgba(0,255,65,0.4)]">Activate Terminal</button>
              </div>

              <div className="p-12 border-4 border-yellow-500 bg-black relative shadow-[15px_15px_0_rgba(234,179,8,0.2)]">
                <div className="absolute top-0 right-0 p-4 font-black text-[10px] text-yellow-600 uppercase italic">Enterprise_B2B</div>
                <h3 className="text-3xl font-black uppercase text-yellow-500 mb-4 tracking-widest">Institutional</h3>
                <p className="text-4xl font-black text-white mb-10 tracking-tighter italic">$500.00 <span className="text-xs text-zinc-600 not-italic uppercase tracking-widest">/ License</span></p>
                <ul className="text-[11px] text-zinc-400 font-black uppercase space-y-4 mb-12">
                   <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-yellow-500"></span> API Key Gen (Quant Webhooks)</li>
                   <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-yellow-500"></span> Advanced Dark Pool Sentiment</li>
                   <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-yellow-500"></span> Full Admin Watchtower Access</li>
                </ul>
                <button onClick={() => setCheckoutTier("B2B")} className="w-full bg-white text-black font-black py-5 uppercase tracking-widest hover:bg-yellow-500 transition-colors">Generate License</button>
              </div>
            </div>
          )}

          {activeTab === "watchtower" && (
            <div className="border border-red-900/50 bg-black overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.1)]">
              <div className="p-6 bg-red-900/20 border-b border-red-900/50 flex justify-between items-center">
                <h4 className="text-red-500 text-xs font-black uppercase tracking-widest">System Activity Protocol</h4>
                <div className="flex gap-4">
                    <span className="text-red-600 text-[10px] font-black uppercase">Users: {adminLogs.length}</span>
                    <span className="text-red-500 text-[10px] font-black animate-pulse uppercase italic">Security_Active</span>
                </div>
              </div>
              <table className="w-full text-left text-[11px] border-collapse">
                <thead><tr className="text-zinc-600 uppercase font-black border-b border-zinc-900"><th className="p-6">Operator Email</th><th className="p-6">Internal ID</th><th className="p-6 text-right">Value (USDT)</th></tr></thead>
                <tbody>
                  {adminLogs.map((log, i) => (
                    <tr key={i} className="border-b border-zinc-900/50 hover:bg-red-900/10 transition-colors">
                      <td className="p-6 font-bold text-white uppercase">{log.userEmail}</td>
                      <td className="p-6 text-zinc-500 font-mono text-[9px] uppercase tracking-tighter">{log.type}</td>
                      <td className={`p-6 text-right font-black tabular-nums ${log.amount < 0 ? 'text-zinc-600' : 'text-[#00ff41]'}`}>{log.amount?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: CRYPTO VAULT AUTHORIZATION */}
      {checkoutTier && (
        <div className="fixed inset-0 bg-black/98 flex items-center justify-center z-[100] p-6 backdrop-blur-xl">
          <div className="bg-[#0c0c0c] border border-[#00ff41] p-12 max-w-xl w-full shadow-[0_0_100px_rgba(0,255,65,0.2)]">
            <h2 className="text-3xl font-black uppercase mb-8 italic text-[#00ff41] tracking-tighter">Vault Verification</h2>
            <div className="mb-10">
              <p className="text-[10px] font-bold mb-3 text-zinc-600 uppercase tracking-widest">Target Asset: USDT (POLYGON)</p>
              <p className="text-[10px] font-bold mb-3 text-zinc-600 uppercase tracking-widest">Expected Value: ${checkoutTier === 'B2B' ? '500.00' : '20.00'}</p>
              <div className="bg-black p-5 border border-zinc-900 text-[11px] font-black text-[#00ff41] select-all break-all shadow-inner">0xYourPolygonWalletAddressHere</div>
            </div>
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-700 uppercase">Input Blockchain Transaction Hash (TxID)</label>
                    <input type="text" placeholder="0X..." value={txIdInput} onChange={(e) => setTxIdInput(e.target.value)} className="w-full p-5 border border-zinc-900 font-black uppercase bg-black text-white text-xs outline-none focus:border-[#00ff41] tracking-tighter" />
                </div>
                <div className="flex gap-5">
                    <button onClick={() => setCheckoutTier(null)} className="flex-1 border border-zinc-800 py-5 font-black uppercase text-[10px] text-zinc-500 hover:text-white transition-colors">Abort</button>
                    <button className="flex-1 bg-[#00ff41] text-black py-5 font-black uppercase text-[10px] hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all">Verify Transaction</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}