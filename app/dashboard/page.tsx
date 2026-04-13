"use client";
import React, { useState, useEffect } from "react";
import Ticker from "../components/Ticker";
import CandleChart from "../components/CandleChart";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const countries = [
  "Afghanistan", "Tanzania", "United States", "United Kingdom", "United Arab Emirates", "China", "Singapore", "Switzerland" // Truncated for brevity, add your full list back
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [tradeAmount, setTradeAmount] = useState<number>(1000);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  
  // AI States
  const [inbuiltSignal, setInbuiltSignal] = useState<any>(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) { setIsLoggedIn(false); setLoading(false); return; }

    try {
      const pRes = await fetch(`${API_URL}/api/users/profile`, { headers: { "Authorization": `Bearer ${token}` } });
      if (!pRes.ok) throw new Error("UNAUTHORIZED");
      const profile = await pRes.json();
      setUser(profile);
      setIsLoggedIn(true);
      
      // Only fetch stream if they have a tier
      if (profile.subscriptionTier !== 'none') {
        const mRes = await fetch(`${API_URL}/api/market/stream`, { headers: { "Authorization": `Bearer ${token}` } });
        if (mRes.ok) {
            const marketData = await mRes.json();
            setStocks(marketData);
            if (!selectedAsset && marketData.length > 0) setSelectedAsset(marketData[0]);
        }
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

  const getInbuiltPrediction = async () => {
    if (!selectedAsset || user?.subscriptionTier === 'none') return;
    try {
        const res = await fetch(`${API_URL}/api/ai/inbuilt/predict/${encodeURIComponent(selectedAsset.symbol)}`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await res.json();
        if (res.ok) setInbuiltSignal(data);
    } catch (e) { console.error(e); }
  };

  const runQuantAI = async () => {
    if (!selectedAsset || !userQuestion) return;
    if (user?.subscriptionTier === 'none') {
      setAiAnalysis("ACCESS DENIED: Trading Academy requires an active Retail License.");
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysis("Querying OpenAI Neural Engine...");
    
    try {
      const res = await fetch(`${API_URL}/api/ai/openai/tutor`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ symbol: selectedAsset.symbol, question: userQuestion })
      });
      
      const data = await res.json();
      if (res.ok) {
        let i = 0;
        setAiAnalysis("");
        setUserQuestion(""); // Clear input
        const interval = setInterval(() => {
          setAiAnalysis(data.tutorResponse.slice(0, i));
          i++;
          if (i > data.tutorResponse.length) { clearInterval(interval); setIsAnalyzing(false); }
        }, 15);
      }
    } catch (e) {
      setAiAnalysis("Academy API offline. Retry connection.");
      setIsAnalyzing(false);
    }
  };

  if (loading) return <div className="bg-black min-h-screen text-[#00ff41] font-mono flex items-center justify-center animate-pulse tracking-[0.5em] text-xs uppercase">Initializing Secure Node...</div>;

  if (!isLoggedIn) {
    // Auth UI remains the same
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
            <button onClick={() => setActiveTab("academy")} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === "academy" ? "bg-[#00ff41] text-black" : "text-zinc-500 hover:text-white"}`}>AI Academy</button>
            <button onClick={() => setActiveTab("licenses")} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === "licenses" ? "bg-[#00ff41] text-black" : "text-zinc-500 hover:text-white"}`}>Licenses</button>
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
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Account Status</p>
              <p className="text-xl font-black text-[#00ff41] tracking-tighter uppercase">{user?.subscriptionTier === 'none' ? 'UNLICENSED' : user.subscriptionTier}</p>
            </div>
          </header>

          {user?.subscriptionTier === 'none' && activeTab !== 'licenses' ? (
             <div className="p-10 border border-red-900/50 bg-red-900/10 text-center">
                 <h2 className="text-red-500 text-2xl font-black uppercase tracking-widest mb-4">Access Restricted</h2>
                 <p className="text-zinc-500 text-sm mb-6">You must acquire a license to access real-time streams and AI capabilities.</p>
                 <button onClick={() => setActiveTab("licenses")} className="bg-red-600 text-white px-8 py-3 font-black uppercase tracking-widest">View Licenses</button>
             </div>
          ) : (
              <>
                  {activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      {stocks.map(s => (
                        <div key={s.symbol} onClick={() => {setSelectedAsset(s); setActiveTab("terminal");}} className="bg-[#0f0f0f] border border-zinc-800 p-8 cursor-pointer hover:border-[#00ff41] transition-all group">
                          <div className="flex justify-between mb-4">
                             <span className="text-xs font-black text-zinc-400 group-hover:text-white">{s.symbol}</span>
                             {s.change && <span className={`text-[10px] font-black ${s.change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>{s.change}</span>}
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
                          <div key={s.symbol} onClick={() => { setSelectedAsset(s); setInbuiltSignal(null); }} className={`p-4 cursor-pointer hover:bg-zinc-900 border-b border-zinc-900 flex justify-between items-center transition-all ${selectedAsset?.symbol === s.symbol ? 'bg-[#00ff41]/10 border-l-4 border-l-[#00ff41]' : ''}`}>
                            <span className="font-black text-white text-xs">{s.symbol}</span>
                            <span className={`text-[10px] font-mono font-black text-[#00ff41]`}>${s.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="w-3/5 bg-[#0d0d0d] border border-zinc-800 p-1 flex flex-col relative">
                         <div className="flex-1 flex items-center justify-center">
                             {selectedAsset ? <CandleChart symbol={selectedAsset.symbol} currentPrice={selectedAsset.price} /> : <span className="text-zinc-600 text-xs uppercase font-black tracking-widest">Connect Stream...</span>}
                         </div>
                      </div>

                      <div className="w-1/5 bg-[#0d0d0d] border border-zinc-800 p-6 flex flex-col justify-start">
                         <h3 className="text-[#00ff41] font-black uppercase text-sm mb-4 border-b border-zinc-800 pb-2">Proprietary Algos</h3>
                         <button onClick={getInbuiltPrediction} className="w-full bg-zinc-900 border border-zinc-700 text-white font-black py-3 uppercase tracking-widest hover:border-[#00ff41] transition-all text-xs mb-6">Run Math Analysis</button>
                         
                         {inbuiltSignal && (
                             <div className="bg-black border border-[#00ff41] p-4 text-center">
                                 <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Signal Generated</p>
                                 <p className={`text-xl font-black uppercase ${inbuiltSignal.signal.includes('BUY') ? 'text-[#00ff41]' : (inbuiltSignal.signal.includes('SELL') ? 'text-red-500' : 'text-yellow-500')}`}>{inbuiltSignal.signal}</p>
                                 <p className="text-xs text-zinc-400 mt-2">SMA: ${inbuiltSignal.movingAverage}</p>
                             </div>
                         )}
                      </div>
                    </div>
                  )}

                  {activeTab === "academy" && (
                    <div className="space-y-10 max-w-5xl">
                        <div className="bg-[#0d0d0d] border border-[#00ff41] p-8 relative overflow-hidden">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">OpenAI Neural Tutor</h3>
                            <p className="text-xs text-zinc-400 mb-6 uppercase tracking-widest">Ask a specific question about an asset.</p>
                            
                            <div className="flex gap-4 mb-4">
                                {stocks.map(s => (
                                    <button key={s.symbol} onClick={() => setSelectedAsset(s)} className={`px-4 py-2 border ${selectedAsset?.symbol === s.symbol ? 'border-[#00ff41] text-[#00ff41]' : 'border-zinc-800 text-zinc-500'} text-xs font-black uppercase bg-black`}>{s.symbol}</button>
                                ))}
                            </div>

                            <div className="flex gap-4 mb-6">
                                <input 
                                   type="text" 
                                   value={userQuestion} 
                                   onChange={(e) => setUserQuestion(e.target.value)} 
                                   placeholder="e.g., Explain why I should buy this right now." 
                                   className="flex-1 bg-black border border-zinc-800 p-3 text-white outline-none focus:border-[#00ff41] text-sm font-mono"
                                />
                                <button onClick={runQuantAI} disabled={isAnalyzing || !selectedAsset || !userQuestion} className="bg-[#00ff41] text-black px-6 font-black uppercase disabled:opacity-50 tracking-widest">Ask AI</button>
                            </div>

                            <div className="p-6 min-h-[120px] font-mono text-sm leading-relaxed border border-zinc-800 text-[#00ff41] bg-black">
                                {aiAnalysis || "Awaiting query..."}
                            </div>
                        </div>
                    </div>
                  )}
              </>
          )}

          {activeTab === "licenses" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="p-12 border border-zinc-800 bg-[#0d0d0d] hover:border-[#00ff41] transition-all">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Retail Operator</h3>
                <p className="text-xs text-zinc-500 uppercase mt-2 mb-6 h-8">Unlocks Live Trading & Academy AI.</p>
                <p className="text-4xl font-black text-[#00ff41] mb-10 italic">$20.00 <span className="text-xs text-zinc-600 not-italic uppercase">/ Month</span></p>
                <button onClick={() => alert("Payment Gateway Pending Setup.")} className="bg-[#00ff41] text-black w-full py-5 font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,255,65,0.4)]">Buy License</button>
              </div>
              <div className="p-12 border-4 border-yellow-500 bg-black hover:shadow-[10px_10px_0_rgba(234,179,8,0.2)] transition-all">
                <h3 className="text-2xl font-black text-yellow-500 uppercase tracking-tighter">Institutional B2B</h3>
                <p className="text-xs text-zinc-500 uppercase mt-2 mb-6 h-8">Bring-Your-Own-Key. Unlocks specific server API endpoints.</p>
                <p className="text-4xl font-black text-white mb-10 italic">$500.00 <span className="text-xs text-zinc-600 not-italic uppercase">/ Month</span></p>
                <button onClick={() => alert("Contact System Administrator to provision B2B.")} className="bg-white text-black w-full py-5 font-black uppercase tracking-widest hover:bg-yellow-500 transition-colors">Request Node</button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}