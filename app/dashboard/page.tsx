"use client";
import React, { useState, useEffect } from "react";
import Ticker from "../components/Ticker";
import CandleChart from "../components/CandleChart";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

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
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [tradeAmount, setTradeAmount] = useState<number>(1000);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) { setIsLoggedIn(false); setLoading(false); return; }

    try {
      const [pRes, mRes] = await Promise.all([
        fetch(`${API_URL}/api/users/profile`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${API_URL}/api/market/stocks`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      
      if (!pRes.ok) throw new Error("UNAUTHORIZED");
      const profile = await pRes.json();
      setUser(profile);
      setIsLoggedIn(true);
      
      const marketData = await mRes.json();
      setStocks(marketData);
      if (!selectedAsset && marketData.length > 0) setSelectedAsset(marketData[0]);

      if (profile.role === "admin") {
        const aRes = await fetch(`${API_URL}/api/admin/all-transactions`, { headers: { "Authorization": `Bearer ${token}` } });
        if (aRes.ok) setAdminLogs(await aRes.json());
      }
    } catch (e) { localStorage.removeItem("token"); setIsLoggedIn(false); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 5000); 
    return () => clearInterval(inv);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isVerifying ? "/auth/verify" : (authMode === "login" ? "/auth/login" : "/auth/register");
    const body = isVerifying ? { email, otp } : { email, password, fullName, country };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.status === 201) {
        setIsVerifying(true);
        alert("SECURITY KEY DISPATCHED. Check your email.");
        return;
      }
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        window.location.reload(); 
      } else { alert(data.error || "ACCESS REJECTED"); }
    } catch (err) { alert("GATEWAY ERROR."); }
  };

  const openPosition = async (side: 'buy' | 'sell') => {
    if (!selectedAsset || !user) return;
    try {
      const res = await fetch(`${API_URL}/api/trade/execute`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ symbol: selectedAsset.symbol, amount: tradeAmount, side })
      });
      if (res.ok) fetchData();
    } catch (err) {}
  };

  const runQuantAI = async () => {
    if (!selectedAsset) return;
    if (!user?.hasActiveSubscription) {
      setAiAnalysis("ACCESS DENIED: Trading Academy requires an active Retail License ($20/mo).");
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysis("Querying OpenAI Neural Engine...");
    
    try {
      const res = await fetch(`${API_URL}/api/ai/tutor`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ symbol: selectedAsset.symbol, price: selectedAsset.price })
      });
      
      const data = await res.json();
      if (res.ok) {
        let i = 0;
        setAiAnalysis("");
        const interval = setInterval(() => {
          setAiAnalysis(data.lesson.slice(0, i));
          i++;
          if (i > data.lesson.length) { clearInterval(interval); setIsAnalyzing(false); }
        }, 15);
      }
    } catch (e) {
      setAiAnalysis("Academy API offline. Retry connection.");
      setIsAnalyzing(false);
    }
  };

  const processPurchase = async (tier: string) => {
      const txId = window.prompt(`TRANSFER PROTOCOL INITIATED.\n\nPlease complete the transfer to the verified Polygon address.\nEnter your Blockchain Transaction Hash (TxID) below to verify payment:`);
      
      if (!txId) return;

      try {
        const res = await fetch(`${API_URL}/api/payment/verify-crypto`, {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ txId, tier })
        });
        const data = await res.json();
        
        if (res.ok) {
            alert("SUCCESS: License Secured and Balance Updated.");
            window.location.reload();
        } else {
            alert(`VERIFICATION FAILED: ${data.error}`);
        }
      } catch(e) {
          alert("GATEWAY ERROR: Unable to reach blockchain API.");
      }
  };

  const forceAdminUpgrade = async () => {
      const secret = window.prompt("SECURITY PROTOCOL: Enter Developer Override Key:");
      if (!secret) return;

      try {
        const res = await fetch(`${API_URL}/api/admin/force-upgrade`, {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ adminSecret: secret })
        });
        
        if (res.ok) {
            alert("Admin Rights Granted.");
            window.location.reload();
        } else {
            alert("SECURITY BREACH: Incorrect Override Key.");
        }
      } catch(e) {}
  };

  if (loading) return <div className="bg-black min-h-screen text-[#00ff41] font-mono flex items-center justify-center animate-pulse tracking-[0.5em] text-xs uppercase">Initializing Secure Node...</div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono p-4">
        <div className="w-full max-w-md bg-[#0d0d0d] border border-zinc-800 p-10 shadow-2xl">
          <h2 className="text-4xl font-black text-white uppercase italic mb-8 border-b border-[#00ff41] pb-2">
             {isVerifying ? "Authorize" : (authMode === "login" ? "Identity" : "Create")}
          </h2>
          <form onSubmit={handleAuth} className="space-y-4">
            {isVerifying ? (
              <input type="text" placeholder="XXXXXX" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-black border border-[#00ff41] p-4 text-[#00ff41] text-center text-2xl font-black outline-none" required />
            ) : (
              <>
                {authMode === "register" && (
                    <>
                        <input type="text" placeholder="FULL NAME" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white uppercase outline-none focus:border-[#00ff41]" required />
                        <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white text-xs uppercase outline-none focus:border-[#00ff41]">
                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </>
                )}
                <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white uppercase outline-none focus:border-[#00ff41]" required />
                <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white uppercase outline-none focus:border-[#00ff41]" required />
              </>
            )}
            <button type="submit" className="w-full bg-[#00ff41] text-black font-black py-4 uppercase tracking-widest">{isVerifying ? "Unlock Session" : "Confirm"}</button>
          </form>
          {!isVerifying && <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full mt-6 text-[10px] text-zinc-500 uppercase tracking-widest hover:text-[#00ff41]">Toggle Access Mode</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono flex flex-col">
      <Ticker stocks={stocks} />
      <div className="flex flex-1">
        
        {/* SIDEBAR */}
        <aside className="w-72 bg-[#0d0d0d] border-r border-zinc-800 p-8 flex flex-col">
          <h1 className="text-2xl font-black text-[#00ff41] italic tracking-tighter uppercase mb-10">NN-Fintech</h1>
          <nav className="flex-1 space-y-3">
            <button onClick={() => setActiveTab("overview")} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === "overview" ? "bg-[#00ff41] text-black" : "text-zinc-500 hover:text-white"}`}>Overview</button>
            <button onClick={() => setActiveTab("terminal")} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === "terminal" ? "bg-[#00ff41] text-black" : "text-zinc-500 hover:text-white"}`}>Trading Terminal</button>
            <button onClick={() => setActiveTab("academy")} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === "academy" ? "bg-[#00ff41] text-black" : "text-zinc-500 hover:text-white"}`}>Trading Academy</button>
            <button onClick={() => setActiveTab("licenses")} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === "licenses" ? "bg-[#00ff41] text-black" : "text-zinc-500 hover:text-white"}`}>Licenses</button>
            
            {user?.role === "admin" && (
              <button onClick={() => setActiveTab("watchtower")} className={`w-full mt-10 text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest border border-red-900/50 ${activeTab === "watchtower" ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]" : "text-red-500 hover:bg-red-900/20"}`}>Watchtower [ADMIN]</button>
            )}

            {/* THE SECURED DEV BACKDOOR BUTTON */}
            {user?.role !== "admin" && (
                <button onClick={forceAdminUpgrade} className="w-full mt-4 text-left px-5 py-2 text-[8px] font-black text-zinc-600 hover:text-[#00ff41] uppercase tracking-widest border border-zinc-800">
                    [DEV] Claim Admin Rights
                </button>
            )}
          </nav>
          <div className="mt-auto pt-5 border-t border-zinc-800">
             <button onClick={() => { localStorage.removeItem("token"); window.location.reload(); }} className="w-full border border-red-500/50 text-red-500 text-[10px] py-3 font-black uppercase hover:bg-red-600 hover:text-white transition-all">Terminate</button>
          </div>
        </aside>

        {/* MAIN VIEW */}
        <main className="flex-1 p-10 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#051505] via-[#0a0a0a] to-[#0a0a0a]">
          <header className="flex justify-between items-end mb-10 border-b border-zinc-800 pb-10">
            <h2 className="text-5xl font-black uppercase italic text-white tracking-tighter">{activeTab}</h2>
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Simulated Liquidity</p>
              <p className="text-4xl font-black text-[#00ff41] tracking-tighter">${user?.demoBalance?.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
          </header>

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {stocks.map(s => (
                <div key={s.symbol} onClick={() => {setSelectedAsset(s); setActiveTab("terminal");}} className="bg-[#0f0f0f] border border-zinc-800 p-8 cursor-pointer hover:border-[#00ff41] transition-all group">
                  <div className="flex justify-between mb-4">
                     <span className="text-xs font-black text-zinc-400 group-hover:text-white">{s.symbol}</span>
                     <span className={`text-[10px] font-black ${s.change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>{s.change}</span>
                  </div>
                  <p className="text-3xl font-black tabular-nums tracking-tighter">${s.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "terminal" && (
            <div className="flex gap-6 min-h-[600px]">
              <div className="w-1/5 bg-[#0d0d0d] border border-zinc-800 p-4 overflow-y-auto">
                <p className="text-[10px] font-black text-zinc-500 mb-4 border-b border-zinc-800 pb-2 uppercase tracking-widest">Markets</p>
                {stocks.map(s => (
                  <div key={s.symbol} onClick={() => setSelectedAsset(s)} className={`p-4 cursor-pointer hover:bg-zinc-900 border-b border-zinc-900 flex justify-between items-center transition-all ${selectedAsset?.symbol === s.symbol ? 'bg-[#00ff41]/10 border-l-4 border-l-[#00ff41]' : ''}`}>
                    <span className="font-black text-white text-xs">{s.symbol}</span>
                    <span className={`text-[10px] font-mono font-black ${s.change.includes('+') ? 'text-[#00ff41]' : 'text-red-500'}`}>${s.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="w-3/5 bg-[#0d0d0d] border border-zinc-800 p-1 flex items-center justify-center relative">
                 {selectedAsset ? <CandleChart symbol={selectedAsset.symbol} currentPrice={selectedAsset.price} /> : <span className="text-zinc-600 text-xs uppercase font-black tracking-widest">Connect Stream...</span>}
              </div>

              <div className="w-1/5 bg-[#0d0d0d] border border-zinc-800 p-6 flex flex-col justify-end">
                  {user?.hasActiveSubscription ? (
                    <>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Exposure (USDT)</label>
                      <input type="number" value={tradeAmount} onChange={(e) => setTradeAmount(Number(e.target.value))} className="w-full bg-black border border-zinc-800 text-white p-4 font-black outline-none mb-6 focus:border-[#00ff41]" />
                      <div className="flex flex-col gap-4">
                        <button onClick={() => openPosition('buy')} className="w-full bg-[#00ff41] text-black font-black py-4 uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all">LONG</button>
                        <button onClick={() => openPosition('sell')} className="w-full border-2 border-red-500 text-red-500 font-black py-4 uppercase tracking-widest hover:bg-red-900/20 transition-all">SHORT</button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-red-500 text-[10px] font-black uppercase py-10 border border-red-900/30 tracking-widest">Execution Locked.</div>
                  )}
              </div>
            </div>
          )}

          {activeTab === "academy" && (
            <div className="space-y-10 max-w-5xl">
                <div className="bg-[#0d0d0d] border border-[#00ff41] p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="text-9xl font-black text-[#00ff41]">AI</span>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">OpenAI Neural Tutor</h3>
                    <p className="text-xs text-zinc-400 mb-6 uppercase tracking-widest">Select an asset below to generate a live market lesson.</p>
                    <div className="flex gap-4 mb-6">
                        {stocks.map(s => (
                            <button key={s.symbol} onClick={() => { setSelectedAsset(s); runQuantAI(); }} className="px-6 py-2 border border-zinc-800 hover:border-[#00ff41] text-xs font-black uppercase bg-black">{s.symbol}</button>
                        ))}
                    </div>
                    <div className={`p-6 min-h-[120px] font-mono text-sm leading-relaxed border ${!user?.hasActiveSubscription ? 'border-red-900/50 text-red-500 bg-red-900/10' : 'border-zinc-800 text-[#00ff41] bg-black'}`}>
                        {aiAnalysis || "Awaiting target selection..."}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="border border-zinc-800 bg-[#0d0d0d] p-8">
                        <h4 className="text-[#00ff41] font-black uppercase text-xl mb-4">1. The Mechanics</h4>
                        <ul className="space-y-4 text-sm text-zinc-400">
                            <li><strong className="text-white">LONG (Buy):</strong> Executing a Long position means you anticipate the asset's price will rise. You buy now to sell higher later.</li>
                            <li><strong className="text-white">SHORT (Sell):</strong> Executing a Short means you anticipate the asset will drop. You borrow the asset, sell it, and buy it back cheaper.</li>
                        </ul>
                    </div>
                    <div className="border border-zinc-800 bg-[#0d0d0d] p-8">
                        <h4 className="text-[#00ff41] font-black uppercase text-xl mb-4">2. Technical Analysis</h4>
                        <ul className="space-y-4 text-sm text-zinc-400">
                            <li><strong className="text-white">Support & Resistance:</strong> Invisible "floors" and "ceilings" where price historically bounces or rejects.</li>
                            <li><strong className="text-white">Trendlines:</strong> The market moves in waves. An uptrend is marked by Higher Highs and Higher Lows. Don't fight the trend.</li>
                        </ul>
                    </div>
                    <div className="border border-zinc-800 bg-[#0d0d0d] p-8">
                        <h4 className="text-[#00ff41] font-black uppercase text-xl mb-4">3. Risk Management</h4>
                        <ul className="space-y-4 text-sm text-zinc-400">
                            <li><strong className="text-white">The 1% Rule:</strong> Never risk more than 1-2% of your total capital on a single trade. Preservation of capital is the #1 goal.</li>
                            <li><strong className="text-white">Stop-Loss (SL):</strong> A non-negotiable exit strategy. Set a hard line where you admit the trade is invalid.</li>
                        </ul>
                    </div>
                    <div className="border border-zinc-800 bg-[#0d0d0d] p-8">
                        <h4 className="text-[#00ff41] font-black uppercase text-xl mb-4">4. Trading Psychology</h4>
                        <ul className="space-y-4 text-sm text-zinc-400">
                            <li><strong className="text-white">FOMO:</strong> Fear of Missing Out. Buying the top of a massive green candle because you feel left behind. This is how retail loses money.</li>
                            <li><strong className="text-white">Patience:</strong> 90% of trading is waiting for the perfect setup. 10% is execution.</li>
                        </ul>
                    </div>
                </div>
            </div>
          )}

          {activeTab === "licenses" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="p-12 border border-zinc-800 bg-[#0d0d0d] hover:border-[#00ff41] transition-all">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Retail Operator</h3>
                <p className="text-xs text-zinc-500 uppercase mt-2 mb-6 h-8">Unlocks Live Trading & Academy AI.</p>
                <p className="text-4xl font-black text-[#00ff41] mb-10 italic">$20.00 <span className="text-xs text-zinc-600 not-italic uppercase">/ Month</span></p>
                <button onClick={() => processPurchase("RETAIL")} className="bg-[#00ff41] text-black w-full py-5 font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,255,65,0.4)]">Activate Terminal</button>
              </div>
              <div className="p-12 border-4 border-yellow-500 bg-black hover:shadow-[10px_10px_0_rgba(234,179,8,0.2)] transition-all">
                <h3 className="text-2xl font-black text-yellow-500 uppercase tracking-tighter">Institutional B2B</h3>
                <p className="text-xs text-zinc-500 uppercase mt-2 mb-6 h-8">Generates API Keys for White-label Integration.</p>
                <p className="text-4xl font-black text-white mb-10 italic">$500.00 <span className="text-xs text-zinc-600 not-italic uppercase">/ License</span></p>
                <button onClick={() => processPurchase("B2B")} className="bg-white text-black w-full py-5 font-black uppercase tracking-widest hover:bg-yellow-500 transition-colors">Generate License</button>
              </div>
            </div>
          )}

          {activeTab === "watchtower" && (
            <div className="border border-red-900/50 bg-black shadow-[0_0_30px_rgba(220,38,38,0.1)]">
              <div className="p-6 bg-red-900/20 border-b border-red-900/50 flex justify-between items-center">
                <h4 className="text-red-500 font-black text-[10px] uppercase tracking-widest">Security Protocol Active</h4>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </div>
              <table className="w-full text-left text-[11px] text-white">
                <thead>
                    <tr className="border-b border-zinc-900 text-zinc-600 uppercase tracking-widest"><th className="p-6">Operator ID</th><th className="p-6">Action</th><th className="p-6 text-right">Value (USD)</th></tr>
                </thead>
                <tbody>
                  {adminLogs.map((log, i) => (
                    <tr key={i} className="border-b border-zinc-900/50 hover:bg-red-900/10">
                        <td className="p-6 font-bold">{log.userEmail}</td>
                        <td className="p-6 text-zinc-500 font-mono uppercase">{log.type}</td>
                        <td className={`p-6 text-right font-black tabular-nums ${log.amount < 0 ? 'text-zinc-600' : 'text-[#00ff41]'}`}>{log.amount?.toFixed(2)}</td>
                    </tr>
                  ))}
                  {adminLogs.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-zinc-600 uppercase font-black text-xs tracking-widest">No Operator Activity Detected</td></tr>}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}