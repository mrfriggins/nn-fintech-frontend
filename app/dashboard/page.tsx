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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
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
      if (!pRes.ok) throw new Error("UNAUTHORIZED");
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
    } catch (e) { localStorage.removeItem("token"); setIsLoggedIn(false); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 4000); 
    return () => clearInterval(inv);
  }, [activeTab]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "register" && !termsAccepted && !isVerifying) return; 
    
    const endpoint = isVerifying ? "/auth/verify" : (authMode === "login" ? "/auth/login" : "/auth/register");
    const body = isVerifying ? { email, otp } : { email, password, fullName, country };
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.status === 201) { setIsVerifying(true); alert("SECURITY CODE DISPATCHED."); return; }
      if (res.ok && data.token) { localStorage.setItem("token", data.token); window.location.reload(); } 
      else { alert(data.error || "ACCESS DENIED"); }
    } catch (err) { alert("GATEWAY OFFLINE"); }
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
    setIsAnalyzing(true);
    setAiAnalysis("Querying Neural Network...");
    try {
      const res = await fetch(`${API_URL}/api/ai/openai/tutor`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ question: userQuestion, symbol: selectedAsset?.symbol })
      });
      const data = await res.json();
      if (res.ok) {
        let i = 0;
        const txt = data.tutorResponse || "No response.";
        const interval = setInterval(() => {
          setAiAnalysis(txt.slice(0, i));
          i++;
          if (i > txt.length) { clearInterval(interval); setIsAnalyzing(false); }
        }, 15);
      }
    } catch (e) { setIsAnalyzing(false); setAiAnalysis("Error reaching AI provider."); }
  };

  const processPurchase = async (tier: string) => {
    setIsCheckingOut(true);
    try {
        const res = await fetch(`${API_URL}/api/payment/create-invoice`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
            body: JSON.stringify({ tier })
        });
        const data = await res.json();
        if (res.ok) setCheckoutInfo(data);
        else alert(`Error: ${data.error}`);
    } catch(e) { alert("Payment Gateway Offline"); } 
    finally { setIsCheckingOut(false); }
  };

  const handleBanUser = async (targetEmail: string) => {
    if (!confirm(`Are you sure you want to completely ban ${targetEmail} from the platform?`)) return;
    try {
        const res = await fetch(`${API_URL}/api/admin/ban`, {
            method: "POST", 
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
            body: JSON.stringify({ targetEmail })
        });
        if (res.ok) {
            alert(`User ${targetEmail} has been banned.`);
            fetchData();
        } else {
            alert("Failed to ban user.");
        }
    } catch (e) { alert("Error connecting to admin controls."); }
  };

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    setCheckoutInfo(null);
    setIsMobileMenuOpen(false);
  };

  if (loading) return <div className="bg-black min-h-screen text-[#00ff41] font-mono flex items-center justify-center animate-pulse tracking-widest text-xs">BOOTING SECURE NODE...</div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono p-4">
        {showTermsModal && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                <div className="bg-[#0d0d0d] border border-[#00ff41] max-w-2xl w-full max-h-[80vh] flex flex-col">
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-xl font-black text-[#00ff41] uppercase">Agreement</h2>
                        <button onClick={() => setShowTermsModal(false)} className="text-zinc-500 hover:text-white">✕</button>
                    </div>
                    <div className="p-6 overflow-y-auto text-xs text-zinc-400 space-y-4 font-mono leading-relaxed">
                        <p><strong className="text-white">EDTECH NOTICE:</strong> NN-Fintech is educational software. Simulated data only. Licenses non-refundable.</p>
                    </div>
                    <div className="p-6 border-t border-zinc-800">
                        <button onClick={() => {setTermsAccepted(true); setShowTermsModal(false);}} className="w-full bg-[#00ff41] text-black font-black py-3 uppercase tracking-widest">Accept</button>
                    </div>
                </div>
            </div>
        )}
        <div className="w-full max-w-md bg-[#0d0d0d] border border-zinc-800 p-10 shadow-2xl">
          <h2 className="text-4xl font-black text-white uppercase italic mb-8 border-b border-[#00ff41] pb-2">
             {isVerifying ? "Authorize" : (authMode === "login" ? "Identity" : "Create Node")}
          </h2>
          <form onSubmit={handleAuth} className="space-y-4">
            {isVerifying ? (
              <input type="text" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-black border border-[#00ff41] p-4 text-[#00ff41] text-center text-2xl font-black outline-none" required />
            ) : (
              <>
                {authMode === "register" && (
                    <>
                        <input type="text" placeholder="NAME" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white uppercase outline-none focus:border-[#00ff41]" required />
                        <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white text-xs uppercase outline-none focus:border-[#00ff41]">
                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </>
                )}
                <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white uppercase outline-none focus:border-[#00ff41]" required />
                <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-white uppercase outline-none focus:border-[#00ff41]" required />
                {authMode === "register" && (
                    <div className="flex items-start gap-3 mt-4 mb-2 p-3 bg-zinc-900/50 border border-zinc-800">
                        <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 w-4 h-4 accent-[#00ff41]" />
                        <label htmlFor="terms" className="text-[9px] text-zinc-400 uppercase leading-relaxed">
                            Agree to <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#00ff41] font-black underline">Service Agreement</button>.
                        </label>
                    </div>
                )}
              </>
            )}
            <button type="submit" disabled={authMode === "register" && !termsAccepted && !isVerifying} className="w-full bg-[#00ff41] text-black font-black py-4 uppercase tracking-widest disabled:opacity-30 hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all">
                {isVerifying ? "Unlock Session" : "Confirm"}
            </button>
          </form>
          {!isVerifying && <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full mt-6 text-[10px] text-zinc-500 uppercase tracking-widest hover:text-[#00ff41]">Toggle Mode</button>}
        </div>
      </div>
    );
  }

  const isLocked = user?.subscriptionTier === 'none' && user?.role !== 'admin' && user?.email !== 'nicholausdominic86@gmail.com';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono flex flex-col overflow-hidden">
      <Ticker stocks={stocks} />
      <div className="flex flex-1 relative overflow-hidden">
        
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0d0d0d] border-r border-zinc-800 p-8 flex flex-col transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
          <div className="flex justify-between items-center mb-10">
              <h1 className="text-2xl font-black text-[#00ff41] italic uppercase tracking-tighter">NN-Fintech</h1>
              <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-zinc-500 text-xl font-black">✕</button>
          </div>
          <nav className="flex-1 space-y-4">
            {["overview", "terminal", "academy", "licenses"].map(tab => (
              <button key={tab} onClick={() => switchTab(tab)} className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest ${activeTab === tab ? "bg-[#00ff41] text-black" : "text-zinc-500 hover:text-white"}`}>{tab}</button>
            ))}
            {(user?.role === "admin" || user?.email === "nicholausdominic86@gmail.com") && (
              <button onClick={() => switchTab("watchtower")} className={`w-full mt-10 text-left px-4 py-3 text-xs font-black uppercase tracking-widest border border-red-900/50 ${activeTab === "watchtower" ? "bg-red-600 text-white" : "text-red-500 hover:bg-red-900/20"}`}>Watchtower</button>
            )}
          </nav>
          <div className="mt-auto border-t border-zinc-800 pt-5">
             <button onClick={() => { localStorage.removeItem("token"); window.location.reload(); }} className="w-full border border-red-500/50 text-red-500 py-3 text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">Terminate</button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-10 overflow-y-auto bg-[#0a0a0a]">
          <header className="flex justify-between items-start md:items-end mb-8 border-b border-zinc-800 pb-8">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden border border-zinc-800 bg-[#0d0d0d] text-[#00ff41] p-2 text-xs font-black">MENU</button>
                <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">{activeTab}</h2>
            </div>
            <div className="text-right">
              <p className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Demo Vault</p>
              <p className="text-xl md:text-2xl font-black text-[#00ff41]">${Number(user?.demoBalance || 0).toLocaleString()}</p>
            </div>
          </header>

          {/* THE PAYWALL LOCK */}
          {isLocked && activeTab !== "licenses" ? (
             <div className="flex flex-col items-center justify-center h-full min-h-[500px] border border-red-900/50 bg-red-900/10 text-center p-10 mt-10">
                 <h2 className="text-red-500 text-3xl md:text-4xl font-black uppercase tracking-widest mb-4">Access Restricted</h2>
                 <p className="text-zinc-500 mb-8 max-w-md text-xs md:text-sm">You are attempting to access proprietary institutional software without an active license. Acquire a node to initialize the data stream.</p>
                 <button onClick={() => setActiveTab("licenses")} className="bg-red-600 text-white px-12 py-4 font-black uppercase tracking-widest hover:bg-red-500 transition-colors">View Licenses</button>
             </div>
          ) : (
            <>
              {activeTab === "terminal" && (
                <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[900px]">
                  <div className="w-full lg:w-1/4 flex flex-col gap-4">
                    <div className="flex-1 bg-[#0d0d0d] border border-zinc-800 p-4 overflow-y-auto max-h-[400px] lg:max-h-full scrollbar-hide">
                      <p className="text-[10px] font-black text-zinc-500 mb-4 border-b border-zinc-800 pb-2 uppercase tracking-widest">Market Feed</p>
                      <div className="space-y-1">
                        {stocks.map(s => (
                          <div key={s.symbol} onClick={() => { setSelectedAsset(s); setInbuiltSignal(null); }} className={`p-3 cursor-pointer border-b border-zinc-900/30 flex justify-between items-center transition-all ${selectedAsset?.symbol === s.symbol ? 'bg-[#00ff41]/10 border-l-2 border-[#00ff41]' : 'hover:bg-zinc-900'}`}>
                            <span className="font-black text-white text-[11px]">{s.symbol}</span>
                            <p className={`text-[11px] font-mono font-black ${s.change?.includes('+') ? 'text-[#00ff41]' : 'text-red-500'}`}>${Number(s.price).toFixed(4)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#0d0d0d] border border-zinc-800 p-6">
                       <h3 className="text-zinc-600 font-black uppercase text-[10px] mb-4 tracking-widest border-b border-zinc-800 pb-2">Command Exec</h3>
                       <input type="number" value={tradeAmount} onChange={(e) => setTradeAmount(Number(e.target.value))} className="w-full bg-black border border-zinc-800 text-[#00ff41] p-3 font-black outline-none text-xs mb-4 focus:border-[#00ff41]" />
                       <div className="grid grid-cols-2 gap-2">
                         <button onClick={() => openPosition('buy')} className="bg-[#00ff41] text-black font-black py-3 uppercase text-[10px] hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all">Long</button>
                         <button onClick={() => openPosition('sell')} className="border border-red-500 text-red-500 font-black py-3 uppercase text-[10px] hover:bg-red-900/20 transition-all">Short</button>
                       </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-3/4 flex flex-col gap-4">
                    <div className="bg-black border border-zinc-800 relative h-[500px] lg:h-[750px] w-full min-h-[500px]">
                      <div className="absolute top-4 left-4 z-10 bg-black/60 p-3 border border-zinc-800 backdrop-blur-md flex items-center gap-3">
                         <span className="text-[#00ff41] font-black text-[10px] uppercase animate-pulse">● LIVE</span>
                         <span className="text-white font-black text-xs uppercase">{selectedAsset?.symbol || "SELECT ASSET"}</span>
                      </div>
                      <div className="w-full h-full p-2">
                        {selectedAsset ? <CandleChart symbol={selectedAsset.symbol} currentPrice={selectedAsset.price} /> : <div className="w-full h-full flex items-center justify-center text-zinc-800 text-xs font-black tracking-widest uppercase">Initializing Stream...</div>}
                      </div>
                    </div>
                    <div className="bg-[#0d0d0d] border border-zinc-800 p-6 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex-1">
                          <h3 className="text-[#00ff41] font-black uppercase text-[10px] mb-2 tracking-widest">Neural Math Signal</h3>
                          <p className="text-[10px] text-zinc-500 uppercase">Computing {selectedAsset?.symbol || 'Global'} Liquidity Pools.</p>
                        </div>
                        {inbuiltSignal ? (
                          <div className="flex gap-10 items-center animate-in fade-in">
                             <div className="text-center">
                                <p className="text-[8px] text-zinc-500 uppercase mb-1 tracking-widest">Signal</p>
                                <p className={`text-2xl font-black uppercase ${inbuiltSignal?.signal?.includes('BUY') ? 'text-[#00ff41]' : 'text-red-500'}`}>{inbuiltSignal?.signal}</p>
                             </div>
                             <div className="text-center border-l border-zinc-800 pl-10">
                                <p className="text-[8px] text-zinc-500 uppercase mb-1 tracking-widest">SMA (20)</p>
                                <p className="text-xl font-black text-white font-mono">${Number(inbuiltSignal?.movingAverage || 0).toFixed(4)}</p>
                             </div>
                          </div>
                        ) : <button onClick={getInbuiltPrediction} className="bg-zinc-900 border border-zinc-700 text-white font-black px-12 py-3 uppercase text-[10px] tracking-widest hover:border-[#00ff41] transition-all">Compute</button>}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stocks.map(s => (
                    <div key={s.symbol} onClick={() => {setSelectedAsset(s); setActiveTab("terminal");}} className="bg-[#0f0f0f] border border-zinc-800 p-8 cursor-pointer hover:border-[#00ff41] transition-all group">
                      <div className="flex justify-between mb-4 items-center">
                         <span className="text-xs font-black text-zinc-500 group-hover:text-white transition-colors">{s.symbol}</span>
                         <span className={`text-[10px] font-black px-2 py-1 bg-black border ${s.change?.includes('+') ? 'text-[#00ff41] border-[#00ff41]/30' : 'text-red-500 border-red-500/30'}`}>{s.change}</span>
                      </div>
                      <p className="text-3xl font-black tabular-nums tracking-tighter">${Number(s.price).toFixed(4)}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "academy" && (
                <div className="max-w-5xl bg-[#0d0d0d] border border-[#00ff41] p-6 md:p-10">
                    <h3 className="text-2xl font-black text-white uppercase mb-4 tracking-tighter">Oracle Engine</h3>
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <input type="text" value={userQuestion} onChange={(e) => setUserQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runAI()} placeholder="Inquire about market mechanics..." className="flex-1 bg-black border border-zinc-800 text-[#00ff41] p-4 text-xs font-mono outline-none focus:border-[#00ff41]" />
                        <button onClick={runAI} disabled={isAnalyzing} className="bg-[#00ff41] text-black px-10 py-4 md:py-0 font-black uppercase text-xs disabled:opacity-50 tracking-widest">Ask</button>
                    </div>
                    <div className="p-6 md:p-8 min-h-[300px] font-mono text-sm border border-zinc-800 text-[#00ff41] bg-black leading-relaxed">{aiAnalysis || "Ready for inquiry..."}</div>
                </div>
              )}
            </>
          )}

          {activeTab === "licenses" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl">
                {!checkoutInfo ? (
                    <>
                        <div className="p-8 md:p-12 border border-zinc-800 bg-[#0d0d0d] hover:border-[#00ff41] transition-all group">
                            <h3 className="text-2xl font-black text-white uppercase">Retail Operator</h3>
                            <p className="text-4xl font-black text-[#00ff41] mt-4 italic">$20.00 <span className="text-xs text-zinc-600 not-italic uppercase tracking-widest">/ Month</span></p>
                            <button onClick={() => processPurchase("RETAIL")} disabled={isCheckingOut} className="bg-[#00ff41] text-black w-full mt-10 py-5 font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all">Activate</button>
                        </div>
                        <div className="p-8 md:p-12 border-4 border-yellow-500 bg-black">
                            <h3 className="text-2xl font-black text-yellow-500 uppercase">Institutional Feed</h3>
                            <p className="text-4xl font-black text-white mt-4 italic">$500.00 <span className="text-xs text-zinc-600 not-italic uppercase tracking-widest">/ Month</span></p>
                            <button onClick={() => processPurchase("B2B")} disabled={isCheckingOut} className="bg-white text-black w-full mt-10 py-5 font-black uppercase tracking-widest hover:bg-yellow-500 transition-colors">Provision Node</button>
                        </div>
                    </>
                ) : (
                    <div className="col-span-1 lg:col-span-2 bg-[#0d0d0d] border border-[#00ff41] p-10 max-w-2xl mx-auto text-center font-mono w-full">
                        <h3 className="text-2xl font-black text-white mb-6 uppercase">USDT Payment Awaiting</h3>
                        <div className="bg-black border border-zinc-800 p-6 mb-8">
                             <p className="text-zinc-500 text-[10px] uppercase mb-1 tracking-widest">Send Exactly:</p>
                             <p className="text-4xl font-black text-[#00ff41] mb-6">{checkoutInfo.pay_amount} USDT</p>
                             <p className="text-zinc-500 text-[10px] uppercase mb-1 tracking-widest">Polygon Address:</p>
                             <p className="text-[10px] text-white break-all bg-zinc-900 p-4 border border-zinc-800">{checkoutInfo.pay_address}</p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <a href={checkoutInfo.invoice_url} target="_blank" rel="noreferrer" className="bg-zinc-800 text-white px-8 py-4 font-black uppercase text-xs tracking-widest hover:bg-zinc-700">Open in Gateway</a>
                            <button onClick={() => setCheckoutInfo(null)} className="border border-red-500 text-red-500 px-8 py-4 font-black uppercase text-xs tracking-widest hover:bg-red-900/20">Cancel Request</button>
                        </div>
                    </div>
                )}
            </div>
          )}

          {activeTab === "watchtower" && (
            <div className="space-y-12">
                <div className="border border-red-900/50 bg-black overflow-x-auto">
                  <div className="p-6 bg-red-900/10 border-b border-red-900/50 flex justify-between items-center min-w-[600px]">
                      <h4 className="text-red-500 font-black uppercase text-[10px] tracking-widest">Global Operator Ledger</h4>
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  </div>
                  <table className="w-full text-left text-xs text-white min-w-[600px]">
                    <thead>
                        <tr className="text-zinc-600 uppercase tracking-widest border-b border-zinc-900">
                            <th className="p-4">Email</th>
                            <th className="p-4">Tier</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                      {adminUsersList.map((u, i) => (
                        <tr key={i} className="border-b border-zinc-900/30 hover:bg-red-900/10">
                          <td className="p-4 font-bold">{u.email}</td>
                          <td className="p-4 uppercase text-[#00ff41] font-black">{u.subscriptionTier}</td>
                          <td className="p-4 uppercase font-black">{u.isActive ? <span className="text-green-500">Active</span> : <span className="text-red-500">Banned</span>}</td>
                          <td className="p-4 text-right">
                              {u.isActive && u.email !== user?.email && (
                                  <button onClick={() => handleBanUser(u.email)} className="text-[9px] font-black uppercase text-red-500 border border-red-900/50 px-3 py-2 hover:bg-red-600 hover:text-white transition-colors tracking-widest">Kill Session</button>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="border border-red-900/50 bg-black overflow-x-auto">
                  <div className="p-6 bg-red-900/10 border-b border-red-900/50 flex justify-between items-center min-w-[600px]">
                      <h4 className="text-red-500 font-black uppercase text-[10px] tracking-widest">Transaction Feed</h4>
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  </div>
                  <table className="w-full text-left text-[11px] text-white min-w-[600px]">
                    <thead>
                        <tr className="text-zinc-600 uppercase tracking-widest border-b border-zinc-900">
                            <th className="p-6">User ID</th>
                            <th className="p-6">Action</th>
                            <th className="p-6 text-right">Value (USD)</th>
                        </tr>
                    </thead>
                    <tbody>
                      {adminLogs.map((log, i) => (
                        <tr key={i} className="border-b border-zinc-900/30 hover:bg-red-900/10">
                          <td className="p-6 font-bold">{log.userEmail}</td>
                          <td className="p-6 text-zinc-500 uppercase font-mono">{log.type}</td>
                          <td className={`p-6 text-right font-black tabular-nums ${Number(log.amount || 0) < 0 ? 'text-zinc-600' : 'text-[#00ff41]'}`}>
                            {Number(log.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}