"use client";

import { useState, useEffect } from "react";

export default function UnifiedSystemPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const [authMode, setAuthMode] = useState<"login" | "register" | "verify" | "forgot" | "reset">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [otp, setOtp] = useState("");

  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("terminal");
  const [marketAssets, setMarketAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [tradeAmount, setTradeAmount] = useState<string>("1000");
  const [algoSignal, setAlgoSignal] = useState<any>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [targetBanEmail, setTargetBanEmail] = useState("");
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMarketData();
      const interval = setInterval(fetchMarketData, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const checkSession = async () => {
    const token = localStorage.getItem("token");
    if (!token) { setIsInitializing(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setUser(await res.json());
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("token");
      }
    } catch (e) { 
      console.error("Session sync cluster broken."); 
    }
    setIsInitializing(false);
  };

  const executeAuthCall = async (endpoint: string, payload: any) => {
    setAuthLoading(true); setAuthError(""); setAuthSuccess("");
    try {
      const res = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      setAuthLoading(false);
      return { ok: res.ok, data };
    } catch (err) {
      setAuthLoading(false); 
      setAuthError("Network cluster offline."); 
      return { ok: false, data: null };
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, data } = await executeAuthCall("login", { email, password });
    if (ok) { 
      localStorage.setItem("token", data.token); 
      checkSession(); 
    }
    else if (data?.error === "Verify email first.") setAuthMode("verify");
    else setAuthError(data?.error || "Login rejected.");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, data } = await executeAuthCall("register", { email, password, fullName, country });
    if (ok) { 
      setAuthSuccess("Verification transmission dispatched."); 
      setAuthMode("verify"); 
    }
    else setAuthError(data?.error || "Registration rejected.");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, data } = await executeAuthCall("verify", { email, otp });
    if (ok) { 
      localStorage.setItem("token", data.token); 
      checkSession(); 
    }
    else setAuthError(data?.error || "Verification failed.");
  };

  const switchAuthMode = (mode: any) => { setAuthMode(mode); setAuthError(""); setAuthSuccess(""); setShowPassword(false); };
  const logout = () => { localStorage.removeItem("token"); setIsAuthenticated(false); setUser(null); };

  const fetchMarketData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/market/stream`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (res.ok) {
        const data = await res.json(); 
        setMarketAssets(data);
        if (!selectedAsset && data.length > 0) setSelectedAsset(data[0]);
      }
    } catch (e) { }
  };

  const fetchPredictiveSignal = async (symbol: string) => {
    setAlgoSignal(null);
    try {
      const res = await fetch(`${API_URL}/api/ai/inbuilt/predict/${encodeURIComponent(symbol)}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const data = await res.json();
      if (res.ok) {
        setAlgoSignal(data);
      } else if (data.paymentRequired) {
        setAlgoSignal({ locked: true });
      }
    } catch (e) {
      setAlgoSignal({ locked: true });
    }
  };

  const handleExecuteTrade = async (side: "buy" | "sell") => {
    if (!selectedAsset) return;
    try {
      const res = await fetch(`${API_URL}/api/trade/execute`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ symbol: selectedAsset.symbol, side, amount: Number(tradeAmount) })
      });
      const data = await res.json();
      if (res.ok) { 
        setUser((prev: any) => ({ ...prev, demoBalance: data.newBalance })); 
        alert("Simulated order executed successfully."); 
      }
      else alert(`Denied: ${data.error}`);
    } catch (e) {}
  };

  const initializeCryptoCheckout = async () => {
    setIsCheckoutLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payment/create`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Could not launch processing module.");
      }
    } catch (e) {
      alert("Billing engine endpoint unreachable.");
    }
    setIsCheckoutLoading(false);
  };

  const askOracle = async () => {
    if (!aiQuestion) return;
    setIsAiLoading(true); setAiResponse("");
    try {
      const res = await fetch(`${API_URL}/api/ai/openai/tutor`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ question: aiQuestion })
      });
      const data = await res.json(); 
      if (res.ok) {
        setAiResponse(data.tutorResponse);
      } else if (data.paymentRequired) {
        setAiResponse("[UPGRADE REQUIRED] System core locked. Please subscribe via the checkout tunnel to query the intelligence neural matrix.");
      }
    } catch (error) { 
      setAiResponse("[CRITICAL ERROR] Core connection failed."); 
    }
    setIsAiLoading(false);
  };

  if (isInitializing) return <div className="min-h-screen bg-black text-green-500 flex items-center justify-center font-mono text-xs tracking-widest animate-pulse">CONNECTING TO COGNITIVE CORE...</div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center p-4 selection:bg-green-500 selection:text-black">
        <div className="border border-green-900 bg-[#050505] p-8 w-full max-w-md shadow-[0_0_20px_rgba(0,255,0,0.05)]">
          <h1 className="text-xl font-bold tracking-widest mb-2 text-center">NN-FINTECH</h1>
          <h2 className="text-xs text-gray-500 tracking-widest mb-6 text-center border-b border-gray-900 pb-4">[{authMode.toUpperCase()}_GATEWAY]</h2>
          
          {authError && <div className="mb-4 p-3 border border-red-900 text-red-500 bg-red-950/20 text-xs tracking-wider text-center">{authError}</div>}
          {authSuccess && <div className="mb-4 p-3 border border-green-900 text-green-400 bg-green-950/20 text-xs tracking-wider text-center">{authSuccess}</div>}

          {authMode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 tracking-widest">IDENTIFIER (EMAIL)</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-gray-800 p-2 text-white focus:outline-none focus:border-green-600 text-sm rounded-none" />
              </div>
              <div className="relative">
                <label className="block text-[10px] text-gray-500 mb-1 tracking-widest flex justify-between">PASSPHRASE</label>
                <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-gray-800 p-2 text-white focus:outline-none focus:border-green-600 text-sm rounded-none pr-16" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-7 text-[10px] text-gray-500 hover:text-green-400 font-bold bg-black px-1">{showPassword ? "[HIDE]" : "[SHOW]"}</button>
              </div>
              <button type="submit" disabled={authLoading} className="w-full bg-green-950/20 border border-green-700 text-green-400 hover:bg-green-500 hover:text-black transition-colors p-3 text-xs font-bold tracking-widest mt-4">{authLoading ? "AUTHENTICATING..." : "INITIATE HANDSHAKE"}</button>
              <button type="button" onClick={() => switchAuthMode("register")} className="w-full border border-gray-900 text-gray-500 hover:text-green-400 hover:border-green-900 transition-colors p-3 text-xs tracking-wider mt-2 block">[ PROVISION NEW ACCOUNT ]</button>
            </form>
          )}

          {authMode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] text-gray-500 mb-1">FULL NAME</label><input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-black border border-gray-800 p-2 text-white focus:outline-none focus:border-green-600 text-sm rounded-none" /></div>
                <div><label className="block text-[10px] text-gray-500 mb-1">COUNTRY</label><input type="text" required value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-black border border-gray-800 p-2 text-white focus:outline-none focus:border-green-600 text-sm rounded-none" /></div>
              </div>
              <div><label className="block text-[10px] text-gray-500 mb-1">EMAIL ADDRESS</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-gray-800 p-2 text-white focus:outline-none focus:border-green-600 text-sm rounded-none" /></div>
              <div className="relative"><label className="block text-[10px] text-gray-500 mb-1">PASSPHRASE</label><input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-gray-800 p-2 text-white focus:outline-none focus:border-green-600 text-sm rounded-none pr-16" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-7 text-[10px] text-gray-500 hover:text-green-400 font-bold bg-black px-1">{showPassword ? "[HIDE]" : "[SHOW]"}</button></div>
              <button type="submit" disabled={authLoading} className="w-full bg-green-950/20 border border-green-700 text-green-400 hover:bg-green-500 hover:text-black p-3 text-xs font-bold tracking-widest mt-4">{authLoading ? "PROVISIONING..." : "GENERATE IDENTITY"}</button>
              <button type="button" onClick={() => switchAuthMode("login")} className="w-full text-xs text-gray-500 hover:text-gray-300 mt-4 tracking-wider text-center block">[ ABORT & RETURN ]</button>
            </form>
          )}

          {authMode === "verify" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-xs text-gray-400 text-center mb-6 leading-relaxed bg-neutral-900/50 p-4 border border-neutral-800">OTP tracking packet dispatched to <span className="text-green-500 block mt-2 font-bold">{email}</span></div>
              <div><label className="block text-[10px] text-gray-500 mb-1 text-center">6-DIGIT CORE OTP</label><input type="text" required value={otp} onChange={e => setOtp(e.target.value)} className="w-full bg-black border border-gray-800 p-3 text-center text-white focus:outline-none focus:border-green-600 text-2xl tracking-[0.5em] font-bold" maxLength={6} /></div>
              <button type="submit" disabled={authLoading} className="w-full bg-green-950/20 border border-green-700 text-green-400 hover:bg-green-500 hover:text-black p-3 text-xs font-bold tracking-widest mt-4">{authLoading ? "VERIFYING..." : "COMMIT ACCESS CLEARANCE"}</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin" || user?.email === "nicholausdominic86@gmail.com";
  const operatesPremium = user?.subscriptionTier === "ai_5" || isAdmin;

  return (
    <div className="min-h-screen bg-[#070707] text-gray-300 font-mono flex flex-col overflow-hidden">
      
      <div className="w-full bg-[#0d0d0d] border-b border-gray-900 py-1.5 overflow-hidden relative flex items-center">
        <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap gap-10 text-[11px]">
          {marketAssets.length > 0 ? (
            [...marketAssets, ...marketAssets].map((asset, i) => (
              <span key={i} className="inline-flex items-center space-x-2">
                <span className="text-gray-500 font-bold">[{asset.type}]</span>
                <span className="text-white font-bold">{asset.symbol}</span>
                <span className="text-gray-300">${asset.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                <span className={asset.change.startsWith("+") ? "text-green-500" : "text-red-500"}>{asset.change}</span>
              </span>
            ))
          ) : (
            <span className="text-gray-600 tracking-widest text-xs">SYNCHRONIZING SYSTEM INSTRUMENT RATES...</span>
          )}
        </div>
      </div>

      <header className="border-b border-gray-900 p-4 flex justify-between items-center bg-black">
        <div className="flex items-center space-x-6">
          <span className="text-green-500 font-bold tracking-widest text-sm">NN-FINTECH LAYER 1</span>
          <span className="text-xs text-gray-500 bg-gray-950 px-3 py-1 border border-gray-800">AI CLEARANCE: {operatesPremium ? "AUTHORIZED" : "LEVEL 1 FREE"}</span>
          <span className="text-xs text-green-400 bg-gray-950 px-3 py-1 border border-gray-800">SIMULATED BAL: ${user?.demoBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <button onClick={logout} className="text-xs border border-red-900 text-red-500 px-3 py-1 hover:bg-red-950/30">DISCONNECT_NODE</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-gray-900 bg-black p-4 flex flex-col space-y-1">
          <button onClick={() => setActiveTab("terminal")} className={`text-left p-3 text-xs tracking-wider border ${activeTab === "terminal" ? "border-green-600 text-green-400 bg-green-950/10" : "border-transparent text-gray-600 hover:text-gray-400"}`}>&gt; TRADING_TERMINAL</button>
          <button onClick={() => setActiveTab("academy")} className={`text-left p-3 text-xs tracking-wider border ${activeTab === "academy" ? "border-green-600 text-green-400 bg-green-950/10" : "border-transparent text-gray-600 hover:text-gray-400"}`}>&gt; INTELLIGENCE_ORACLE</button>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto bg-neutral-950">
          {activeTab === "terminal" && (
            <div className="grid grid-cols-3 gap-6 h-full min-h-[500px]">
              <div className="col-span-2 border border-gray-900 bg-black p-4 flex flex-col">
                <div className="flex justify-between items-center border-b border-gray-900 pb-2 mb-4">
                  <span className="text-xs font-bold text-gray-400">MARKET DATA ASSETS</span>
                  {selectedAsset && <span className="text-xs text-green-500 font-bold">{selectedAsset.symbol} // ${selectedAsset.price}</span>}
                </div>
                <div className="flex-1 overflow-y-auto max-h-[350px] mb-4 space-y-1 pr-2">
                  {marketAssets.map(asset => (
                    <div key={asset.symbol} onClick={() => { setSelectedAsset(asset); fetchPredictiveSignal(asset.symbol); }} className={`flex justify-between p-2 text-xs cursor-pointer border ${selectedAsset?.symbol === asset.symbol ? "border-green-800 bg-neutral-900" : "border-transparent hover:bg-neutral-900/50"}`}>
                      <span className="text-gray-400 font-bold">{asset.symbol} <span className="text-[9px] text-gray-600">({asset.type})</span></span>
                      <div className="space-x-4"><span>${asset.price.toFixed(2)}</span><span className={asset.change.startsWith("+") ? "text-green-500" : "text-red-500"}>{asset.change}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-900 bg-black p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 border-b border-gray-900 pb-2 mb-4">ORDER EXECUTION</h3>
                  <label className="text-[10px] text-gray-500 block mb-1">POSITION SIZE (USD)</label>
                  <input type="number" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} className="w-full bg-neutral-950 border border-gray-800 p-2 text-xs text-white mb-4 focus:outline-none focus:border-green-600" />
                  
                  <div className="border border-neutral-900 p-3 bg-neutral-950 mb-4 text-[11px]">
                    <p className="text-purple-400 font-bold mb-2">QUANT ALGO TELEMETRY</p>
                    {algoSignal?.locked ? (
                      <div className="space-y-2">
                        <p className="text-gray-500 text-[10px]">Predictive vector mapping is locked on your node tier.</p>
                        <button onClick={initializeCryptoCheckout} disabled={isCheckoutLoading} className="w-full bg-purple-950 text-purple-400 border border-purple-700 text-[10px] py-1 font-bold hover:bg-purple-500 hover:text-black">
                          {isCheckoutLoading ? "GENERATING INVOICE..." : "UNLOCK PREDICTIONS ($5/MO)"}
                        </button>
                      </div>
                    ) : algoSignal ? (
                      <div className="space-y-1">
                        <p>PREDICTION: <span className="text-green-400 font-bold">{algoSignal.signal}</span></p>
                        <p>MOVING AVERAGE: <span>${algoSignal.movingAverage}</span></p>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-[10px]">Select an asset matrix above to test node output.</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleExecuteTrade("buy")} className="bg-green-950/40 border border-green-600 text-green-400 hover:bg-green-500 hover:text-black p-3 text-xs font-bold">EXECUTE LONG</button>
                  <button onClick={() => handleExecuteTrade("sell")} className="bg-red-950/40 border border-red-600 text-red-400 hover:bg-red-500 hover:text-black p-3 text-xs font-bold">EXECUTE SHORT</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "academy" && (
            <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-180px)]">
              <h2 className="text-xs text-green-500 mb-4 font-bold tracking-widest">QUANTITATIVE COGNITIVE LAYER</h2>
              
              {operatesPremium ? (
                <>
                  <div className="flex-1 border border-gray-900 bg-black p-4 mb-4 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-gray-400">{aiResponse || "[Pipeline active. Inquire structural patterns...]"}</div>
                  <div className="flex space-x-2">
                    <input type="text" value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} placeholder="Inquire core metrics..." className="flex-1 bg-black border border-gray-800 p-3 text-xs text-white focus:outline-none focus:border-green-600 rounded-none" onKeyDown={e => e.key === "Enter" && !isAiLoading && askOracle()} />
                    <button onClick={askOracle} disabled={isAiLoading || !aiQuestion} className="bg-neutral-900 border border-gray-700 text-xs px-6 hover:bg-green-600 hover:text-black font-bold disabled:opacity-30 text-white">{isAiLoading ? "PROCESSING..." : "QUERY CORE"}</button>
                  </div>
                </>
              ) : (
                <div className="flex-1 border border-purple-900/40 bg-black p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <h3 className="text-purple-400 text-sm font-bold tracking-widest">[ COGNITIVE MATRIX GATED ]</h3>
                  <p className="text-xs text-gray-500 max-w-md">Direct access queries to the Gemini neural execution framework require Level 2 clearance. Subscribe via NOWPayments crypto tunnel to launch features instantly.</p>
                  <button onClick={initializeCryptoCheckout} disabled={isCheckoutLoading} className="px-6 py-3 bg-purple-950 text-purple-400 border border-purple-600 font-bold hover:bg-purple-500 hover:text-black text-xs tracking-wider">
                    {isCheckoutLoading ? "PREPARING PAY MATRIX..." : "ACTIVATE QUANT ORACLE ($5.00 / MO via CRYPTO)"}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}