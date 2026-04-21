"use client";
import React, { useState, useEffect } from "react";
import Ticker from "../components/Ticker";
import CandleChart from "../components/CandleChart";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Comprehensive Global Country List
const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
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
  
  // Legal States
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Admin State
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);

  const [tradeAmount, setTradeAmount] = useState<number>(1000);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  
  // AI States
  const [inbuiltSignal, setInbuiltSignal] = useState<any>(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Checkout States
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
      
      // FIXED: Ensures Super Admin isn't blocked from the data stream by a 'none' tier
      if (profile.subscriptionTier !== 'none' || profile.role === 'admin') {
        const mRes = await fetch(`${API_URL}/api/market/stream`, { headers: { "Authorization": `Bearer ${token}` } });
        if (mRes.ok) {
            const marketData = await mRes.json();
            setStocks(marketData);
            if (!selectedAsset && marketData.length > 0) setSelectedAsset(marketData[0]);
        }
      }

      if (profile.role === 'admin' && activeTab === 'watchtower') {
          const aRes = await fetch(`${API_URL}/api/admin/users`, { headers: { "Authorization": `Bearer ${token}` } });
          if (aRes.ok) setAdminUsersList(await aRes.json());
      }

    } catch (e) { localStorage.removeItem("token"); setIsLoggedIn(false); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 5000); 
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

  const handleProvisionB2B = async (targetEmail: string) => {
      const allowedDomain = prompt("Enter the allowed domain for this client (e.g., https://theirwebsite.com):");
      if (!allowedDomain) return;
      const plainTextPolygonKey = prompt("Enter the client's raw Polygon API Key:");
      if (!plainTextPolygonKey) return;

      try {
          const res = await fetch(`${API_URL}/api/admin/provision-b2b`, {
              method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
              body: JSON.stringify({ targetEmail, allowedDomain, plainTextPolygonKey })
          });
          const data = await res.json();
          if (res.ok) {
              alert(`PROVISIONED. Give this B2B API Key to the client: ${data.api_key}`);
              fetchData();
          } else { alert(data.error); }
      } catch (e) { alert("Error provisioning node."); }
  };

  const handleBanUser = async (targetEmail: string) => {
      if (!confirm(`Are you sure you want to permanently ban ${targetEmail}?`)) return;
      try {
          const res = await fetch(`${API_URL}/api/admin/ban`, {
              method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
              body: JSON.stringify({ targetEmail })
          });
          if (res.ok) fetchData();
      } catch (e) { alert("Error executing ban."); }
  };

  const getInbuiltPrediction = async () => {
    // FIXED: Protect against errors while explicitly allowing Admin bypass
    if (!selectedAsset || (user?.subscriptionTier === 'none' && user?.role !== 'admin')) return;
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
    if (user?.subscriptionTier === 'none' && user?.role !== 'admin') {
      setAiAnalysis("ACCESS DENIED: Neural Academy requires an active Software License.");
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
        setUserQuestion(""); 
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

  const processPurchase = async (tier: string) => {
    setIsCheckingOut(true);
    try {
        const res = await fetch(`${API_URL}/api/payment/create-invoice`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
            body: JSON.stringify({ tier })
        });
        const data = await res.json();
        if (res.ok) { setCheckoutInfo(data); } 
        else { alert(`CHECKOUT FAILED: ${data.error}`); }
    } catch(e) { alert("GATEWAY ERROR: Unable to reach billing server."); } 
    finally { setIsCheckingOut(false); }
  };

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    setCheckoutInfo(null);
    setIsMobileMenuOpen(false);
  };

  if (loading) return <div className="bg-black min-h-screen text-[#00ff41] font-mono flex items-center justify-center animate-pulse tracking-[0.5em] text-xs uppercase">Initializing Secure Node...</div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono p-4">
        
        {/* TERMS AND CONDITIONS MODAL */}
        {showTermsModal && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                <div className="bg-[#0d0d0d] border border-[#00ff41] max-w-2xl w-full max-h-[80vh] flex flex-col">
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-xl font-black text-[#00ff41] uppercase tracking-widest">Master Service Agreement</h2>
                        <button onClick={() => setShowTermsModal(false)} className="text-zinc-500 hover:text-white font-black">✕</button>
                    </div>
                    <div className="p-6 overflow-y-auto text-xs text-zinc-400 space-y-4 leading-relaxed font-mono">
                        <p><strong className="text-white">1. EDUCATIONAL NATURE OF PLATFORM</strong><br/>
                        NN-Fintech operates strictly as an Educational Technology (EdTech) platform. We are not a registered broker-dealer, financial advisor, or investment institution. All market data, proprietary algorithms, and Neural Academy responses provided on this platform are for simulated, educational, and informational purposes only.</p>
                        
                        <p><strong className="text-white">2. NO FINANCIAL ADVICE</strong><br/>
                        No information generated by NN-Fintech, its AI algorithms, or its data feeds should be construed as financial, investment, or trading advice. Users bear full responsibility for any actions taken in live markets based on concepts learned or simulated on this platform.</p>
                        
                        <p><strong className="text-white">3. NON-REFUNDABLE CRYPTO LICENSES</strong><br/>
                        Access to NN-Fintech requires a software license paid via cryptocurrency. Due to the immutable nature of blockchain transactions, all license fees are final, strictly non-refundable, and non-reversible. By authorizing a payment, you acknowledge you are purchasing digital access to software, not depositing capital for trade execution.</p>

                        <p><strong className="text-white">4. B2B / API USAGE (BYOK)</strong><br/>
                        Institutional B2B clients utilizing the "Bring-Your-Own-Key" (BYOK) architecture are solely responsible for their API rate limits, capital exposure, and compliance with their respective local jurisdictions. NN-Fintech acts only as a routing and analysis layer.</p>

                        <p><strong className="text-white">5. LIMITATION OF LIABILITY</strong><br/>
                        Under no circumstances shall NN-Fintech, its operators, or its affiliates be held liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the platform, including but not limited to financial losses incurred outside the simulator environment.</p>
                    </div>
                    <div className="p-6 border-t border-zinc-800 bg-black">
                        <button onClick={() => {setTermsAccepted(true); setShowTermsModal(false);}} className="w-full bg-[#00ff41] text-black font-black py-3 uppercase tracking-widest hover:shadow-[0_0_15px_rgba(0,255,65,0.4)]">Acknowledge & Accept</button>
                    </div>
                </div>
            </div>
        )}

        <div className="w-full max-w-md bg-[#0d0d0d] border border-zinc-800 p-8 md:p-10 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic mb-8 border-b border-[#00ff41] pb-2">
             {isVerifying ? "Authorize" : (authMode === "login" ? "Identity" : "Create Node")}
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
                
                {authMode === "register" && (
                    <div className="flex items-start gap-3 mt-4 mb-2 p-3 bg-zinc-900/50 border border-zinc-800">
                        <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 w-4 h-4 accent-[#00ff41]" />
                        <label htmlFor="terms" className="text-[9px] text-zinc-400 uppercase tracking-widest leading-relaxed">
                            I verify that I have read and agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#00ff41] hover:underline font-black">Master Service Agreement</button>, and I acknowledge this is an Educational Platform, not a financial brokerage.
                        </label>
                    </div>
                )}
              </>
            )}
            
            <button 
                type="submit" 
                disabled={authMode === "register" && !termsAccepted && !isVerifying} 
                className={`w-full font-black py-4 uppercase tracking-widest transition-all ${authMode === "register" && !termsAccepted && !isVerifying ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : "bg-[#00ff41] text-black hover:shadow-[0_0_15px_rgba(0,255,65,0.4)]"}`}
            >
                {isVerifying ? "Unlock Session" : "Confirm"}
            </button>
          </form>
          {!isVerifying && <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full mt-6 text-[10px] text-zinc-500 uppercase tracking-widest hover:text-[#00ff41]">Toggle Access Mode</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono flex flex-col overflow-x-hidden">
      <Ticker stocks={stocks} />
      <div className="flex flex-1 relative">
        
        {/* MOBILE MENU OVERLAY */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* RESPONSIVE SIDEBAR WITH EDTECH SHIELD */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0d0d0d] border-r border-zinc-800 p-8 flex flex-col transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-black text-[#00ff41] italic tracking-tighter uppercase">NN-Fintech</h1>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-zinc-500 text-xl font-black">✕</button>
          </div>
          
          <nav className="flex-1 space-y-3">
            <button onClick={() => switchTab("overview")} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === "overview" ? "bg-[#00ff41] text-black" : "text-zinc-500 hover:text-white"}`}>System Overview</button>
            <button onClick={() => switchTab("terminal")} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === "terminal" ? "bg-[#00ff41] text-black" : "text-zinc-500 hover:text-white"}`}>Market Simulator</button>
            <button onClick={() => switchTab("academy")} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === "academy" ? "bg-[#00ff41] text-black" : "text-zinc-500 hover:text-white"}`}>Neural Academy</button>
            <button onClick={() => switchTab("licenses")} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === "licenses" ? "bg-[#00ff41] text-black" : "text-zinc-500 hover:text-white"}`}>Software Licenses</button>
            
            {user?.role === "admin" && (
              <button onClick={() => switchTab("watchtower")} className={`w-full mt-10 text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest border border-red-900/50 ${activeTab === "watchtower" ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]" : "text-red-500 hover:bg-red-900/20"}`}>Watchtower [ADMIN]</button>
            )}
          </nav>
          
          <div className="mt-auto pt-5 border-t border-zinc-800">
             <div className="mb-4 p-3 border border-zinc-800 bg-black/50 rounded-sm">
                 <p className="text-[7px] text-zinc-500 uppercase leading-relaxed text-justify">
                     <strong>DISCLAIMER:</strong> NN-Fintech is an educational technology platform. We do not provide financial advice, broker real-market trades, or hold client investment funds. All software tools, AI, and data feeds are for simulated educational purposes only. Cryptocurrency payments are for non-refundable software licenses.
                 </p>
             </div>
             <button onClick={() => { localStorage.removeItem("token"); window.location.reload(); }} className="w-full border border-red-500/50 text-red-500 text-[10px] py-3 font-black uppercase hover:bg-red-600 hover:text-white transition-all mb-4">Terminate</button>
             <div className="text-center">
                 <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-black">&copy; {new Date().getFullYear()} Nicholaus Nicholaus.</p>
                 <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-black mt-1">All Rights Reserved.</p>
             </div>
          </div>
        </aside>

        {/* MAIN VIEW */}
        <main className="flex-1 p-4 md:p-10 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#051505] via-[#0a0a0a] to-[#0a0a0a] w-full">
          <header className="flex justify-between items-start md:items-end mb-8 md:mb-10 border-b border-zinc-800 pb-6 md:pb-10">
            <div className="flex items-center gap-4">
               <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden border border-zinc-800 bg-[#0d0d0d] text-[#00ff41] p-2 text-xs font-black uppercase tracking-widest hover:border-[#00ff41]">
                    Menu
               </button>
               <h2 className="text-3xl md:text-5xl font-black uppercase italic text-white tracking-tighter">{activeTab}</h2>
            </div>
            <div className="text-right">
              <p className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">License Status</p>
              <p className="text-sm md:text-xl font-black text-[#00ff41] tracking-tighter uppercase">{user?.subscriptionTier === 'none' && user?.role !== 'admin' ? 'UNLICENSED' : (user?.role === 'admin' ? 'ADMIN OVERRIDE' : user?.subscriptionTier)}</p>
            </div>
          </header>

          {activeTab === "watchtower" && user?.role === "admin" && (
            <div className="border border-red-900/50 bg-black shadow-[0_0_30px_rgba(220,38,38,0.1)] overflow-x-auto">
              <div className="p-4 md:p-6 bg-red-900/20 border-b border-red-900/50 flex justify-between items-center min-w-[600px]">
                <h4 className="text-red-500 font-black text-[10px] uppercase tracking-widest">Global Operator Ledger</h4>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </div>
              <table className="w-full text-left text-xs text-white min-w-[600px]">
                <thead>
                    <tr className="border-b border-zinc-900 text-zinc-600 uppercase tracking-widest">
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Tier</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                  {adminUsersList.map((u, i) => (
                    <tr key={i} className="border-b border-zinc-900/50 hover:bg-red-900/10">
                        <td className="p-4 font-bold">{u.email}</td>
                        <td className="p-4 text-zinc-500 uppercase">{u.role}</td>
                        <td className="p-4 uppercase text-[#00ff41]">{u.subscriptionTier}</td>
                        <td className="p-4 uppercase font-black">{u.isActive ? <span className="text-green-500">Active</span> : <span className="text-red-500">Banned</span>}</td>
                        <td className="p-4 text-right flex justify-end gap-2">
                            {u.subscriptionTier !== 'b2b_500' && u.isActive && (
                                <button onClick={() => handleProvisionB2B(u.email)} className="bg-yellow-600 text-black px-3 py-1 font-black text-[10px] uppercase hover:bg-yellow-500 whitespace-nowrap">Make B2B</button>
                            )}
                            {u.isActive && u.email !== user.email && (
                                <button onClick={() => handleBanUser(u.email)} className="bg-red-900/50 text-red-500 border border-red-500 px-3 py-1 font-black text-[10px] uppercase hover:bg-red-600 hover:text-white">Ban</button>
                            )}
                        </td>
                    </tr>
                  ))}
                  {adminUsersList.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-zinc-600 uppercase font-black text-xs tracking-widest">Loading Ledger...</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {user?.subscriptionTier === 'none' && user?.role !== 'admin' && activeTab !== 'licenses' && activeTab !== 'watchtower' ? (
             <div className="p-6 md:p-10 border border-red-900/50 bg-red-900/10 text-center">
                 <h2 className="text-red-500 text-xl md:text-2xl font-black uppercase tracking-widest mb-4">Access Restricted</h2>
                 <p className="text-zinc-500 text-xs md:text-sm mb-6">You must acquire a software license to access the simulator and AI capabilities.</p>
                 <button onClick={() => setActiveTab("licenses")} className="bg-red-600 text-white px-6 md:px-8 py-3 font-black uppercase tracking-widest text-sm">View Licenses</button>
             </div>
          ) : (
              <>
                  {activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                      {stocks.map(s => (
                        <div key={s.symbol} onClick={() => {setSelectedAsset(s); setActiveTab("terminal");}} className="bg-[#0f0f0f] border border-zinc-800 p-6 md:p-8 cursor-pointer hover:border-[#00ff41] transition-all group">
                          <div className="flex justify-between mb-4">
                             <span className="text-xs font-black text-zinc-400 group-hover:text-white">{s.symbol}</span>
                             {s.change && <span className={`text-[10px] font-black ${s.change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>{s.change}</span>}
                          </div>
                          <p className="text-2xl md:text-3xl font-black tabular-nums tracking-tighter">${s.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "terminal" && (
                    <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
                      <div className="w-full lg:w-1/5 bg-[#0d0d0d] border border-zinc-800 p-4 h-48 lg:h-auto overflow-y-auto">
                        <p className="text-[10px] font-black text-zinc-500 mb-4 border-b border-zinc-800 pb-2 uppercase tracking-widest">Simulator Assets</p>
                        {stocks.map(s => (
                          <div key={s.symbol} onClick={() => { setSelectedAsset(s); setInbuiltSignal(null); }} className={`p-3 md:p-4 cursor-pointer hover:bg-zinc-900 border-b border-zinc-900 flex justify-between items-center transition-all ${selectedAsset?.symbol === s.symbol ? 'bg-[#00ff41]/10 border-l-4 border-l-[#00ff41]' : ''}`}>
                            <span className="font-black text-white text-xs">{s.symbol}</span>
                            <span className={`text-[10px] font-mono font-black text-[#00ff41]`}>${s.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="w-full lg:w-3/5 bg-[#0d0d0d] border border-zinc-800 p-1 flex flex-col relative min-h-[300px]">
                         <div className="flex-1 flex items-center justify-center p-2">
                             {selectedAsset ? <CandleChart symbol={selectedAsset.symbol} currentPrice={selectedAsset.price} /> : <span className="text-zinc-600 text-xs uppercase font-black tracking-widest text-center">Connect Stream...</span>}
                         </div>
                      </div>

                      <div className="w-full lg:w-1/5 bg-[#0d0d0d] border border-zinc-800 p-4 md:p-6 flex flex-col justify-start">
                         <h3 className="text-[#00ff41] font-black uppercase text-xs md:text-sm mb-4 border-b border-zinc-800 pb-2">Proprietary Algos</h3>
                         <button onClick={getInbuiltPrediction} className="w-full bg-zinc-900 border border-zinc-700 text-white font-black py-3 uppercase tracking-widest hover:border-[#00ff41] transition-all text-xs mb-6">Run Math Analysis</button>
                         
                         {inbuiltSignal && (
                             <div className="bg-black border border-[#00ff41] p-4 text-center">
                                 <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Educational Signal</p>
                                 <p className={`text-lg md:text-xl font-black uppercase ${inbuiltSignal.signal.includes('BUY') ? 'text-[#00ff41]' : (inbuiltSignal.signal.includes('SELL') ? 'text-red-500' : 'text-yellow-500')}`}>{inbuiltSignal.signal}</p>
                                 <p className="text-xs text-zinc-400 mt-2">SMA: ${inbuiltSignal.movingAverage}</p>
                             </div>
                         )}
                      </div>
                    </div>
                  )}

                  {activeTab === "academy" && (
                    <div className="space-y-6 md:space-y-10 max-w-5xl">
                        <div className="bg-[#0d0d0d] border border-[#00ff41] p-4 md:p-8 relative overflow-hidden">
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-2">OpenAI Neural Tutor</h3>
                            <p className="text-[10px] md:text-xs text-zinc-400 mb-6 uppercase tracking-widest">Ask a specific educational question about an asset.</p>
                            
                            <div className="flex flex-wrap gap-2 md:gap-4 mb-4">
                                {stocks.map(s => (
                                    <button key={s.symbol} onClick={() => setSelectedAsset(s)} className={`px-3 py-2 border ${selectedAsset?.symbol === s.symbol ? 'border-[#00ff41] text-[#00ff41]' : 'border-zinc-800 text-zinc-500'} text-[10px] md:text-xs font-black uppercase bg-black`}>{s.symbol}</button>
                                ))}
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <input 
                                   type="text" 
                                   value={userQuestion} 
                                   onChange={(e) => setUserQuestion(e.target.value)} 
                                   placeholder="e.g., Explain support and resistance for this asset." 
                                   className="flex-1 bg-black border border-zinc-800 p-3 text-white outline-none focus:border-[#00ff41] text-xs md:text-sm font-mono"
                                />
                                <button onClick={runQuantAI} disabled={isAnalyzing || !selectedAsset || !userQuestion} className="bg-[#00ff41] text-black px-6 py-3 md:py-0 font-black uppercase disabled:opacity-50 tracking-widest text-xs md:text-sm">Ask AI</button>
                            </div>

                            <div className="p-4 md:p-6 min-h-[120px] font-mono text-xs md:text-sm leading-relaxed border border-zinc-800 text-[#00ff41] bg-black">
                                {aiAnalysis || "Awaiting query..."}
                            </div>
                        </div>
                    </div>
                  )}
              </>
          )}

          {activeTab === "licenses" && (
            <div className="max-w-5xl">
                {!checkoutInfo ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                      <div className="p-8 md:p-12 border border-zinc-800 bg-[#0d0d0d] hover:border-[#00ff41] transition-all">
                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Educational Operator</h3>
                        <p className="text-[10px] md:text-xs text-zinc-500 uppercase mt-2 mb-6 h-auto md:h-8">Unlocks Simulator Software & Neural Academy AI.</p>
                        <p className="text-3xl md:text-4xl font-black text-[#00ff41] mb-10 italic">$20.00 <span className="text-[10px] md:text-xs text-zinc-600 not-italic uppercase">/ Month</span></p>
                        <button onClick={() => processPurchase("RETAIL")} disabled={isCheckingOut} className="bg-[#00ff41] text-black w-full py-4 md:py-5 font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] disabled:opacity-50 text-xs md:text-base">
                            {isCheckingOut ? "Connecting..." : "Purchase License"}
                        </button>
                      </div>
                      <div className="p-8 md:p-12 border-4 border-yellow-500 bg-black hover:shadow-[10px_10px_0_rgba(234,179,8,0.2)] transition-all">
                        <h3 className="text-xl md:text-2xl font-black text-yellow-500 uppercase tracking-tighter">Institutional Data Feeds</h3>
                        <p className="text-[10px] md:text-xs text-zinc-500 uppercase mt-2 mb-6 h-auto md:h-8">Unlocks specific server API endpoints and Algorithmic Analysis Software.</p>
                        <p className="text-3xl md:text-4xl font-black text-white mb-10 italic">$500.00 <span className="text-[10px] md:text-xs text-zinc-600 not-italic uppercase">/ Month</span></p>
                        <button onClick={() => processPurchase("B2B")} disabled={isCheckingOut} className="bg-white text-black w-full py-4 md:py-5 font-black uppercase tracking-widest hover:bg-yellow-500 transition-colors disabled:opacity-50 text-xs md:text-base">
                            {isCheckingOut ? "Connecting..." : "Request Software Node"}
                        </button>
                      </div>
                    </div>
                ) : (
                    <div className="bg-[#0d0d0d] border border-[#00ff41] p-6 md:p-10 max-w-2xl mx-auto text-center">
                        <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-2">Awaiting Payment</h3>
                        <p className="text-[10px] md:text-xs text-zinc-400 mb-8 uppercase tracking-widest">Network: Polygon (MATIC)</p>
                        
                        <div className="bg-black border border-zinc-800 p-4 md:p-6 mb-8 inline-block w-full overflow-hidden">
                             <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase tracking-widest mb-2">Send Exactly:</p>
                             <p className="text-3xl md:text-4xl font-black text-[#00ff41] mb-6">{checkoutInfo.pay_amount} USDT</p>
                             
                             <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase tracking-widest mb-2">To Address:</p>
                             <p className="text-xs md:text-sm font-mono text-white break-all bg-zinc-900 p-3 md:p-4 border border-zinc-800">{checkoutInfo.pay_address}</p>
                        </div>
                        
                        <p className="text-[10px] md:text-xs text-zinc-400 mb-8 max-w-md mx-auto">Do not close this page. The system will automatically unlock your license once the blockchain confirms the transaction.</p>
                        
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <a href={checkoutInfo.invoice_url} target="_blank" rel="noreferrer" className="bg-zinc-800 text-white px-6 py-4 md:py-3 font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-zinc-700 text-center">Open in Gateway</a>
                            <button onClick={() => setCheckoutInfo(null)} className="border border-red-500/50 text-red-500 px-6 py-4 md:py-3 font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-red-600 hover:text-white transition-colors">Cancel Request</button>
                        </div>
                    </div>
                )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}