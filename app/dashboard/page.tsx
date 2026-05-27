"use client";

import { useState, useEffect } from "react";

type ChartCandle = {
  open: number;
  high: number;
  low: number;
  close: number;
};

export default function UnifiedSystemPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const [authMode, setAuthMode] = useState<"login" | "register" | "verify">("login");
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
  const [stopLoss, setStopLoss] = useState<string>("");
  const [takeProfit, setTakeProfit] = useState<string>("");
  const [algoSignal, setAlgoSignal] = useState<any>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // CHART STATE
  const [chartHistory, setChartHistory] = useState<{ [key: string]: ChartCandle[] }>({});
  const [chartMode, setChartMode] = useState<"line" | "candle">("candle");

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

  useEffect(() => {
    if (marketAssets.length === 0) return;
    setChartHistory(prev => {
      const updated = { ...prev };
      marketAssets.forEach(asset => {
        if (!updated[asset.symbol]) {
          let lastClose = asset.price * (1 + (Math.random() * 0.01 - 0.005));
          updated[asset.symbol] = Array.from({ length: 15 }, () => {
            const open = lastClose;
            const close = open * (1 + (Math.random() * 0.006 - 0.003));
            const wick = Math.max(Math.abs(close - open), asset.price * 0.0008);
            const high = Math.max(open, close) + wick * (0.4 + Math.random() * 0.6);
            const low = Math.min(open, close) - wick * (0.4 + Math.random() * 0.6);
            lastClose = close;
            return { open, high, low, close };
          });
        }
        const historicalCandles = [...updated[asset.symbol]];
        const lastCandle = historicalCandles[historicalCandles.length - 1];
        if (!lastCandle || lastCandle.close !== asset.price) {
          const open = lastCandle?.close ?? asset.price;
          const close = asset.price;
          const wick = Math.max(Math.abs(close - open), asset.price * 0.0008);
          const high = Math.max(open, close) + wick * 0.6;
          const low = Math.min(open, close) - wick * 0.6;
          historicalCandles.push({ open, high, low, close });
          if (historicalCandles.length > 30) historicalCandles.shift();
          updated[asset.symbol] = historicalCandles;
        }
      });
      return updated;
    });
  }, [marketAssets]);

  useEffect(() => {
    if (selectedAsset && marketAssets.length > 0) {
      const freshData = marketAssets.find(a => a.symbol === selectedAsset.symbol);
      if (freshData) setSelectedAsset(freshData);
    }
  }, [marketAssets, selectedAsset]);

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
    } catch (e) { }
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
    if (ok) { localStorage.setItem("token", data.token); checkSession(); }
    else if (data?.error === "Verify email first.") setAuthMode("verify");
    else setAuthError(data?.error || "Login rejected.");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, data } = await executeAuthCall("register", { email, password, fullName, country });
    if (ok) { setAuthSuccess("Verification transmission dispatched."); setAuthMode("verify"); }
    else setAuthError(data?.error || "Registration rejected.");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, data } = await executeAuthCall("verify", { email, otp });
    if (ok) { localStorage.setItem("token", data.token); checkSession(); }
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
      if (res.ok) setAlgoSignal(data);
      else if (data.paymentRequired) setAlgoSignal({ locked: true });
    } catch (e) { setAlgoSignal({ locked: true }); }
  };

  const handleExecuteTrade = async (side: "buy" | "sell") => {
    if (!selectedAsset) return;
    try {
      const res = await fetch(`${API_URL}/api/trade/execute`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ symbol: selectedAsset.symbol, side, amount: Number(tradeAmount), sl: stopLoss, tp: takeProfit })
      });
      const data = await res.json();
      if (res.ok) { 
        setUser((prev: any) => ({ ...prev, demoBalance: data.newBalance, activePositions: [...(prev.activePositions || []), data.position] })); 
        setStopLoss(""); setTakeProfit("");
      } else alert(`Denied: ${data.error}`);
    } catch (e) {}
  };

  const handleClosePosition = async (positionId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/trade/close`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ positionId })
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev: any) => ({ ...prev, demoBalance: data.newBalance, activePositions: prev.activePositions.filter((p: any) => p.id !== positionId) }));
      }
    } catch (e) {}
  };

  const initializeCryptoCheckout = async () => {
    setIsCheckoutLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payment/create`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) window.location.href = data.checkoutUrl;
      else alert(data.error || "Could not launch processing module.");
    } catch (e) { alert("Billing engine endpoint unreachable."); }
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
      if (res.ok) setAiResponse(data.tutorResponse);
      else if (data.paymentRequired) setAiResponse("[UPGRADE REQUIRED] System core locked. Please subscribe via the checkout tunnel to query the intelligence neural matrix.");
    } catch (error) { setAiResponse("[CRITICAL ERROR] Core connection failed."); }
    setIsAiLoading(false);
  };

  const renderChartPath = () => {
    if (!selectedAsset || !chartHistory[selectedAsset.symbol]) return "";
    const points = chartHistory[selectedAsset.symbol].map(candle => candle.close);
    if (points.length < 2) return "";
    const max = Math.max(...points) * 1.0005;
    const min = Math.min(...points) * 0.9995;
    const range = max - min === 0 ? 1 : max - min;
    const width = 500;
    const height = 180;
    return points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  const renderCandles = () => {
    if (!selectedAsset || !chartHistory[selectedAsset.symbol]) return null;
    const candles = chartHistory[selectedAsset.symbol];
    if (candles.length < 2) return null;
  
    const max = Math.max(...candles.map(candle => candle.high)) * 1.0005;
    const min = Math.min(...candles.map(candle => candle.low)) * 0.9995;
    const range = max - min === 0 ? 1 : max - min;
    const width = 500;
    const height = 180;
    const candleWidth = width / Math.max(candles.length, 10) * 0.55;
  
    return (
      <g>
        {candles.map((candle, idx) => {
          const { open, close, high, low } = candle;
          const isUp = close >= open;
          const color = isUp ? "#22c55e" : "#ef4444"; 
      
          const x = (idx / (candles.length - 1)) * width;
          const yOpen = height - ((open - min) / range) * height;
          const yClose = height - ((close - min) / range) * height;
          const yHigh = height - ((high - min) / range) * height;
          const yLow = height - ((low - min) / range) * height;
      
          return (
            <g key={idx}>
              <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" />
              <rect x={x - candleWidth / 2} y={Math.min(yOpen, yClose)} width={candleWidth} height={Math.max(Math.abs(yOpen - yClose), 1)} fill={color} />
            </g>
          );
        })}
      </g>
    );
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
              <div><label className="block text-[10px] text-gray-500 mb-1 tracking-widest">IDENTIFIER (EMAIL)</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-gray-800 p-2 text-white focus:outline-none focus:border-green-600 text-sm rounded-none" /></div>
              <div className="relative"><label className="block text-[10px] text-gray-500 mb-1 tracking-widest flex justify-between">PASSPHRASE</label><input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-gray-800 p-2 text-white focus:outline-none focus:border-green-600 text-sm rounded-none pr-16" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-7 text-[10px] text-gray-500 hover:text-green-400 font-bold bg-black px-1">{showPassword ? "[HIDE]" : "[SHOW]"}</button></div>
              <button type="submit" disabled={authLoading} className="w-full bg-green-950/20 border border-green-700 text-green-400 hover:bg-green-500 hover:text-black transition-colors p-3 text-xs font-bold tracking-widest mt-4">{authLoading ? "AUTHENTICATING..." : "INITIATE HANDSHAKE"}</button>
              <button type="button" onClick={() => switchAuthMode("register")} className="w-full border border-gray-900 text-gray-500 hover:text-green-400 hover:border-green-900 transition-colors p-3 text-xs tracking-wider mt-2 block">[ PROVISION NEW ACCOUNT ]</button>
            </form>
          )}
          {authMode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] text-gray-500 mb-1">FULL NAME</label><input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-black border border-gray-800 p-2 text-white focus:outline-none focus:border-green-600 text-sm rounded-none" /></div><div><label className="block text-[10px] text-gray-500 mb-1">COUNTRY</label><input type="text" required value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-black border border-gray-800 p-2 text-white focus:outline-none focus:border-green-600 text-sm rounded-none" /></div></div>
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
    <div className="min-h-screen bg-[#070707] text-gray-300 font-mono flex flex-col overflow-hidden pb-14 md:pb-0 relative">
      <style dangerouslySetInnerHTML={{__html: `@keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }`}} />
      <div className="w-full bg-[#0d0d0d] border-b border-gray-900 py-1.5 overflow-hidden relative flex items-center z-20">
        <div className="flex whitespace-nowrap gap-10 text-[11px]" style={{ display: 'inline-flex', whiteSpace: 'nowrap', animation: 'marquee 30s linear infinite' }}>
          {marketAssets.length > 0 ? (
            [...marketAssets, ...marketAssets].map((asset, i) => (
              <span key={i} className="inline-flex items-center space-x-2">
                <span className="text-gray-500 font-bold">[{asset.type}]</span><span className="text-white font-bold">{asset.symbol}</span>
                <span className="text-gray-300">${asset.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                <span className={asset.change.startsWith("+") ? "text-green-500" : "text-red-500"}>{asset.change}</span>
              </span>
            ))
          ) : (<span className="text-gray-600 tracking-widest text-xs">SYNCHRONIZING SYSTEM INSTRUMENT RATES...</span>)}
        </div>
      </div>

      <header className="border-b border-gray-900 p-2 md:p-4 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4 bg-black z-20 relative">
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-6 w-full md:w-auto">
          <span className="text-green-500 font-bold tracking-widest text-[10px] md:text-sm w-full text-center md:w-auto">NN-FINTECH LAYER 1</span>
          <span className="text-[9px] md:text-xs text-gray-500 bg-gray-950 px-2 py-1 border border-gray-800">AI: {operatesPremium ? "AUTH" : "LVL 1"}</span>
          <span className="text-[9px] md:text-xs text-green-400 bg-gray-950 px-2 py-1 border border-gray-800">BAL: ${user?.demoBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <button onClick={logout} className="text-[9px] md:text-xs border border-red-900 text-red-500 px-3 py-1 hover:bg-red-950/30 w-full md:w-auto mt-2 md:mt-0">DISCONNECT_NODE</button>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        <aside className="fixed bottom-0 left-0 w-full md:relative md:w-64 border-t md:border-t-0 md:border-r border-gray-900 bg-black p-2 md:p-4 flex flex-row md:flex-col justify-around md:justify-start space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto shrink-0 z-50">
          <button onClick={() => setActiveTab("terminal")} className={`flex-1 md:flex-none text-center md:text-left p-3 text-[10px] md:text-xs tracking-wider border ${activeTab === "terminal" ? "border-green-600 text-green-400 bg-green-950/10" : "border-transparent text-gray-600 hover:text-gray-400"}`}>[ TRADING_TERMINAL ]</button>
          <button onClick={() => setActiveTab("academy")} className={`flex-1 md:flex-none text-center md:text-left p-3 text-[10px] md:text-xs tracking-wider border ${activeTab === "academy" ? "border-green-600 text-green-400 bg-green-950/10" : "border-transparent text-gray-600 hover:text-gray-400"}`}>[ INTEL_ORACLE ]</button>
        </aside>

        <main className="flex-1 p-2 md:p-6 overflow-y-auto bg-neutral-950 h-full relative z-10">
          {activeTab === "terminal" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
              <div className="lg:col-span-2 flex flex-col space-y-4">
                
                {/* ADVANCED VECTOR CHART ENGINE */}
                <div className="border border-gray-900 bg-black p-4">
                  <div className="flex justify-between items-center border-b border-gray-900 pb-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                      <span className="text-xs font-bold text-gray-400 uppercase">{selectedAsset ? selectedAsset.symbol : "MATRIX_NODE"} VECTOR GRAPH</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => setChartMode(prev => prev === "line" ? "candle" : "line")} 
                        className="text-[10px] bg-gray-900 hover:bg-white hover:text-black border border-gray-700 px-2 py-1 transition-colors font-bold text-white"
                      >
                        MODE: [{chartMode.toUpperCase()}]
                      </button>
                      
                      {selectedAsset && (
                        <div className="text-xs font-mono space-x-3">
                          <span className="text-gray-500">LIVE: <span className="text-white">${selectedAsset.price.toFixed(2)}</span></span>
                          <span className={selectedAsset.change.startsWith("+") ? "text-green-500" : "text-red-500"}>{selectedAsset.change}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-[#050505] border border-neutral-900 h-48 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-20">
                      {Array.from({ length: 24 }).map((_, i) => <div key={i} className="border-t border-l border-neutral-800 w-full h-full" />)}
                    </div>
                    {selectedAsset && chartHistory[selectedAsset.symbol]?.length > 1 ? (
                      <svg className="w-full h-full p-2 overflow-visible relative z-10" viewBox="0 0 500 180" preserveAspectRatio="none">
                        {chartMode === "line" ? (
                          <path d={renderChartPath()} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                        ) : (
                          renderCandles()
                        )}
                      </svg>
                    ) : (<span className="text-neutral-700 text-xs tracking-widest animate-pulse">MAP INTEGRATION STREAMING...</span>)}
                  </div>
                </div>

                <div className="border border-gray-900 bg-black p-4 flex flex-col">
                  <div className="flex justify-between items-center border-b border-gray-900 pb-2 mb-4">
                    <span className="text-xs font-bold text-gray-400">MARKET DATA ASSETS</span>
                  </div>
                  <div className="overflow-y-auto max-h-[150px] space-y-1 pr-2">
                    {marketAssets.map(asset => (
                      <div key={asset.symbol} onClick={() => { setSelectedAsset(asset); fetchPredictiveSignal(asset.symbol); }} className={`flex justify-between p-2 text-xs cursor-pointer border ${selectedAsset?.symbol === asset.symbol ? "border-green-800 bg-neutral-900" : "border-transparent hover:bg-neutral-900/50"}`}>
                        <span className="text-gray-400 font-bold">{asset.symbol} <span className="text-[9px] text-gray-600">({asset.type})</span></span>
                        <div className="space-x-4"><span>${asset.price.toFixed(2)}</span><span className={asset.change.startsWith("+") ? "text-green-500" : "text-red-500"}>{asset.change}</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-900 bg-black p-4">
                  <h3 className="text-xs font-bold text-gray-400 border-b border-gray-900 pb-2 mb-2">ACTIVE POSITIONS</h3>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                    {(!user?.activePositions || user.activePositions.length === 0) ? (
                      <p className="text-[10px] text-gray-600 italic">No open orders.</p>
                    ) : (
                      user.activePositions.map((pos: any) => {
                        const currentAsset = marketAssets.find(a => a.symbol === pos.symbol);
                        const currentPrice = currentAsset ? currentAsset.price : pos.entryPrice;
                        const pnlFactor = pos.side === 'buy' ? (currentPrice - pos.entryPrice) / pos.entryPrice : (pos.entryPrice - currentPrice) / pos.entryPrice;
                        const pnlAmount = pos.amount * pnlFactor;
                        const isProfitable = pnlAmount >= 0;

                        return (
                          <div key={pos.id} className="border border-neutral-800 bg-neutral-900 p-2 text-[11px] flex justify-between items-center">
                            <div>
                              <span className={`font-bold mr-2 ${pos.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>[{pos.side.toUpperCase()}]</span>
                              <span className="text-white font-bold mr-3">{pos.symbol}</span>
                              <span className="text-gray-400 mr-3">Entry: ${pos.entryPrice.toFixed(2)}</span>
                              {pos.sl && <span className="text-red-500 mr-2">SL: ${pos.sl}</span>}
                              {pos.tp && <span className="text-green-500">TP: ${pos.tp}</span>}
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                                {isProfitable ? '+' : ''}{pnlAmount.toFixed(2)} USD
                              </span>
                              <button onClick={() => handleClosePosition(pos.id)} className="bg-gray-800 hover:bg-white hover:text-black border border-gray-600 px-2 py-1 font-bold text-[9px]">CLOSE</button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="border border-gray-900 bg-black p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 border-b border-gray-900 pb-2 mb-4">ORDER EXECUTION</h3>
                  <label className="text-[10px] text-gray-500 block mb-1">POSITION SIZE (USD)</label>
                  <input type="number" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} className="w-full bg-neutral-950 border border-gray-800 p-2 text-xs text-white mb-3 focus:outline-none focus:border-green-600 rounded-none" />
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div><label className="text-[10px] text-red-500 block mb-1">STOP LOSS (PRICE)</label><input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="0.00" className="w-full bg-neutral-950 border border-gray-800 p-2 text-xs text-white focus:outline-none focus:border-red-600 rounded-none" /></div>
                    <div><label className="text-[10px] text-green-500 block mb-1">TAKE PROFIT (PRICE)</label><input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder="0.00" className="w-full bg-neutral-950 border border-gray-800 p-2 text-xs text-white focus:outline-none focus:border-green-600 rounded-none" /></div>
                  </div>
                  <div className="border border-neutral-900 p-3 bg-neutral-950 mb-4 text-[11px] mt-4">
                    <p className="text-purple-400 font-bold mb-2">QUANT ALGO TELEMETRY</p>
                    {algoSignal?.locked ? (
                      <div className="space-y-2">
                        <p className="text-gray-500 text-[10px]">Predictive vector mapping is locked on your node tier.</p>
                        <button onClick={initializeCryptoCheckout} disabled={isCheckoutLoading} className="w-full bg-purple-950 text-purple-400 border border-purple-700 text-[10px] py-1 font-bold hover:bg-purple-500 hover:text-black">
                          {isCheckoutLoading ? "GENERATING INVOICE..." : "UNLOCK PREDICTIONS ($5/MO)"}
                        </button>
                      </div>
                    ) : algoSignal ? (
                      <div className="space-y-1"><p>PREDICTION: <span className="text-green-400 font-bold">{algoSignal.signal}</span></p><p>MOVING AVERAGE: <span>${algoSignal.movingAverage}</span></p></div>
                    ) : (<p className="text-gray-600 text-[10px]">Select an asset matrix above to test node output.</p>)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleExecuteTrade("buy")} className="bg-green-950/40 border border-green-700 text-green-400 hover:bg-green-500 hover:text-black p-3 text-xs font-bold tracking-widest transition-colors">EXECUTE LONG</button>
                  <button onClick={() => handleExecuteTrade("sell")} className="bg-red-950/40 border border-red-700 text-red-400 hover:bg-red-500 hover:text-black p-3 text-xs font-bold tracking-widest transition-colors">EXECUTE SHORT</button>
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
                    <button onClick={askOracle} disabled={isAiLoading || !aiQuestion} className="bg-neutral-900 border border-gray-700 text-xs px-6 hover:bg-green-600 hover:text-black font-bold disabled:opacity-30 text-white">{isAiLoading ? "PROCESSING..." : "QUERY CORE"} </button>
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
    </div>
  );
}
