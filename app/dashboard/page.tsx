"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Ticker from "../components/Ticker";
import CandleChart from "../components/CandleChart";

// THE MASTER ROUTER: Points to live server if it exists, falls back to local for testing
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Time & Execution State
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [checkoutTier, setCheckoutTier] = useState<string | null>(null);
  const [txIdInput, setTxIdInput] = useState("");
  
  // ADVANCED RISK MANAGEMENT STATES
  const [tradeAmount, setTradeAmount] = useState<number>(1000);
  const [tradeDuration, setTradeDuration] = useState<number>(60);
  const [takeProfit, setTakeProfit] = useState<number | "">(""); 
  const [stopLoss, setStopLoss] = useState<number | "">("");

  // Quant AI States
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ==========================================
  // 1. DATA INITIALIZATION
  // ==========================================
  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
    try {
      const [pRes, mRes] = await Promise.all([
        fetch(`${API_URL}/api/users/profile`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${API_URL}/api/market/stocks`, { headers: { "Authorization": `Bearer ${token}` } }).catch(() => ({ json: () => [] }))
      ]);
      
      const profile = await pRes.json();
      setUser(profile);
      
      let backendData = [];
      try { backendData = await mRes.json(); } catch(e) {}

      const demoCommodities = [
        { symbol: "XAU/USD (GOLD)", price: 2385.40, change: "+1.2%" },
        { symbol: "XAG/USD (SILVER)", price: 29.10, change: "+0.8%" },
        { symbol: "WTI CRUDE", price: 82.55, change: "-0.5%" },
        { symbol: "BRENT CRUDE", price: 86.20, change: "-0.3%" },
        { symbol: "NATURAL GAS", price: 2.15, change: "+4.1%" },
        { symbol: "COPPER", price: 4.65, change: "+2.2%" },
        { symbol: "WHEAT", price: 610.25, change: "-1.1%" }
      ];

      const combinedMarketData = [...backendData, ...demoCommodities];
      setStocks(prev => prev.length === 0 ? combinedMarketData : prev);

      if (!selectedAsset && combinedMarketData.length > 0) setSelectedAsset(combinedMarketData[0]);

      if (profile.role === "admin") {
        const aRes = await fetch(`${API_URL}/api/admin/all-transactions`, { headers: { "Authorization": `Bearer ${token}` } });
        if (aRes.ok) setAdminLogs(await aRes.json());
      }
    } catch (e) { console.error("LINK FAILURE"); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 10000); 
    return () => clearInterval(inv);
  }, []); // eslint-disable-line 

  // ==========================================
  // 2. LIVE TICK ENGINE
  // ==========================================
  useEffect(() => {
    if (stocks.length === 0) return;
    const tickInterval = setInterval(() => {
      setStocks(prev => prev.map(s => {
        const volatility = s.price * 0.0005; 
        const move = (Math.random() - 0.5) * volatility;
        return { ...s, price: s.price + move, change: `${move >= 0 ? '+' : '-'}${Math.abs((move / s.price) * 100).toFixed(2)}%` };
      }));
    }, 1000);
    return () => clearInterval(tickInterval);
  }, [stocks]);

  useEffect(() => {
    if (selectedAsset) {
      const liveAsset = stocks.find(s => s.symbol === selectedAsset.symbol);
      if (liveAsset) setSelectedAsset(liveAsset);
    }
  }, [stocks]); // eslint-disable-line

  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(Date.now()), 500);
    return () => clearInterval(clock);
  }, []);

  // ==========================================
  // 3. OMNI-DIRECTIONAL AUTO-LIQUIDATOR
  // ==========================================
  useEffect(() => {
    if (portfolio.length === 0 || stocks.length === 0) return;
    
    portfolio.forEach(position => {
      if (position.isClosing) return;

      const liveAsset = stocks.find(s => s.symbol === position.symbol);
      if (!liveAsset) return;

      const currentPrice = liveAsset.price;
      let triggerReason = null;

      if (currentTime >= position.expiresAt) {
        triggerReason = "TIME EXPIRED";
      } 
      else if (position.side === 'buy') {
        if (position.tp && currentPrice >= position.tp) triggerReason = "TAKE PROFIT HIT";
        if (position.sl && currentPrice <= position.sl) triggerReason = "STOP LOSS HIT";
      } 
      else if (position.side === 'sell') {
        if (position.tp && currentPrice <= position.tp) triggerReason = "TAKE PROFIT HIT";
        if (position.sl && currentPrice >= position.sl) triggerReason = "STOP LOSS HIT";
      }

      if (triggerReason) {
        setPortfolio(prev => prev.map(p => p.id === position.id ? { ...p, isClosing: true } : p));
        liquidatePosition(position.id, triggerReason);
      }
    });
  }, [currentTime, portfolio, stocks]); // eslint-disable-line

  // ==========================================
  // 4. QUANT AI ENGINE
  // ==========================================
  const runQuantAI = (asset: any) => {
    setSelectedAsset(asset);
    setIsAnalyzing(true);
    setAiAnalysis("");
    
    const phrases = [
      `Analyzing ${asset.symbol} order flow... Institutional dark pool accumulation detected. Support solidifying.`,
      `Volatility expanding on ${asset.symbol}. Set tight stops. Algorithms targeting upper liquidity zones.`,
      `Macro data indicates supply squeeze for ${asset.symbol}. Hedging recommended. Bias: BULLISH.`,
      `Warning: Volume anomalies detected in ${asset.symbol}. High probability of a liquidity sweep before continuation.`
    ];
    const targetText = phrases[Math.floor(Math.random() * phrases.length)];
    
    let i = 0;
    const interval = setInterval(() => {
      setAiAnalysis(targetText.slice(0, i)); i++;
      if (i > targetText.length) { clearInterval(interval); setIsAnalyzing(false); }
    }, 20);
  };

  // ==========================================
  // 5. TRADE EXECUTION
  // ==========================================
  const openPosition = async (side: 'buy' | 'sell') => {
    if (!selectedAsset || !user) return;
    if (user.demoBalance < tradeAmount) return alert("INSUFFICIENT LIQUIDITY");
    if (tradeDuration < 10) return alert("MINIMUM DURATION IS 10 SECONDS");

    try {
      const res = await fetch(`${API_URL}/api/trade/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ symbol: selectedAsset.symbol, amount: tradeAmount, side })
      });
      
      if (res.ok) {
        const newContract = {
          id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          symbol: selectedAsset.symbol,
          side: side,
          invested: tradeAmount,
          qty: tradeAmount / selectedAsset.price,
          entryPrice: selectedAsset.price,
          expiresAt: Date.now() + (tradeDuration * 1000), 
          tp: takeProfit ? Number(takeProfit) : null,
          sl: stopLoss ? Number(stopLoss) : null,
          isClosing: false
        };
        
        setPortfolio(prev => [...prev, newContract]);
        fetchData(); 
        
        setTakeProfit("");
        setStopLoss("");
      } else {
        alert("EXECUTION REJECTED.");
      }
    } catch (err) { alert("NETWORK ERROR"); }
  };

  const liquidatePosition = async (contractId: string, reason = "MANUAL LIQUIDATION") => {
    const position = portfolio.find(p => p.id === contractId);
    if (!position) return;

    const closingSide = position.side === 'buy' ? 'sell' : 'buy';

    try {
      const res = await fetch(`${API_URL}/api/trade/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ symbol: position.symbol, amount: position.invested, side: closingSide }) 
      });

      if (res.ok) {
        setPortfolio(prev => prev.filter(p => p.id !== contractId));
        fetchData(); 
        alert(`[${position.symbol}] CLOSED: ${reason}`);
      }
    } catch (err) { console.error("Liquidation Failed", err); }
  };

  const autofillRisk = (type: 'long' | 'short') => {
    if(!selectedAsset) return;
    if (type === 'long') {
      setTakeProfit(Number((selectedAsset.price * 1.05).toFixed(2))); 
      setStopLoss(Number((selectedAsset.price * 0.95).toFixed(2))); 
    } else {
      setTakeProfit(Number((selectedAsset.price * 0.95).toFixed(2))); 
      setStopLoss(Number((selectedAsset.price * 1.05).toFixed(2))); 
    }
  };

  if (loading) return <div className="bg-[#050505] min-h-screen flex items-center justify-center text-[#00ff41] font-black uppercase tracking-widest">Decrypting Ledger...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono flex flex-col">
      <Ticker stocks={stocks} />

      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-[#0d0d0d] border-r border-zinc-800 p-6 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,1)] z-10">
          <div className="mb-10">
            <h1 className="text-xl font-black text-[#00ff41] italic tracking-tighter uppercase">NN-Vault</h1>
            <div className="h-0.5 w-full bg-gradient-to-r from-[#00ff41] to-transparent mt-1"></div>
          </div>

          <nav className="flex-1 space-y-2">
            {["overview", "terminal", "licenses"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase transition-all ${
                  activeTab === tab ? "bg-[#00ff41] text-black shadow-[0_0_15px_rgba(0,255,65,0.3)]" : "text-zinc-500 hover:text-[#00ff41]"
                }`}
              >
                {tab}
              </button>
            ))}
            {user?.role === "admin" && (
              <button onClick={() => setActiveTab("watchtower")} className={`w-full mt-10 text-left px-4 py-3 text-[10px] font-black uppercase transition-all border border-red-900/50 ${activeTab === "watchtower" ? "bg-red-600 text-white" : "text-red-500 hover:bg-red-900/20"}`}>
                Watchtower [ADMIN]
              </button>
            )}
          </nav>

          <div className="mt-auto p-4 bg-[#050505] border border-red-900/30 rounded-sm">
            <p className="text-[9px] text-zinc-600 uppercase font-black mb-1">Active Operator</p>
            <p className="text-[10px] font-bold truncate text-[#00ff41] mb-4">{user?.email || "SYSTEM_ADMIN"}</p>
            <button 
              onClick={() => { localStorage.removeItem("token"); router.push("/auth"); }} 
              className="w-full border border-red-500/50 text-red-500 py-3 text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-[0_0_10px_rgba(220,38,38,0.1)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            >
              Terminate Session
            </button>
          </div>
        </aside>

        {/* MAIN PANEL */}
        <main className="flex-1 p-8 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#051505] via-[#0a0a0a] to-[#0a0a0a]">
          
          <header className="flex justify-between items-end mb-8 border-b border-zinc-800 pb-6">
            <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">{activeTab}</h2>
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Simulated Liquidity (USDT)</p>
              <p className="text-4xl font-black text-[#00ff41] tabular-nums">${user?.demoBalance?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}</p>
            </div>
          </header>

          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {stocks.slice(0,6).map(s => (
                <div key={s.symbol} className="bg-[#0f0f0f] border border-zinc-800 p-8 hover:border-[#00ff41] transition-colors cursor-pointer" onClick={() => {runQuantAI(s); setActiveTab("terminal");}}>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-black text-zinc-400 uppercase">{s.symbol}</span>
                    <span className={`text-[10px] font-black ${s.change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>{s.change}</span>
                  </div>
                  <p className="text-3xl font-black text-white">${s.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB: TRADING TERMINAL */}
          {activeTab === "terminal" && (
            <div className="flex gap-6 h-[750px] animate-in slide-in-from-bottom-4">
              
              <div className="w-1/4 bg-[#0d0d0d] border border-zinc-800 overflow-y-auto">
                <div className="p-4 bg-black border-b border-zinc-800 text-[10px] font-black uppercase text-zinc-500 sticky top-0 z-10">Live Markets</div>
                {stocks.map(s => (
                  <div key={s.symbol} onClick={() => runQuantAI(s)} className={`p-4 border-b border-zinc-800 cursor-pointer flex justify-between items-center transition-all ${selectedAsset?.symbol === s.symbol ? 'bg-[#00ff41]/10 border-l-4 border-l-[#00ff41]' : 'hover:bg-zinc-900'}`}>
                    <p className="font-black text-white text-[11px]">{s.symbol}</p>
                    <p className={`font-mono text-xs font-black transition-colors duration-300 ${s.change.includes('+') ? 'text-green-400' : 'text-red-400'}`}>${s.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="w-2/4 flex flex-col gap-6">
                <div className="bg-[#0d0d0d] border border-zinc-800 p-1 relative min-h-[300px]">
                  {selectedAsset ? <CandleChart symbol={selectedAsset.symbol} currentPrice={selectedAsset.price} /> : <div className="text-zinc-600 flex items-center justify-center h-full text-xs font-black">SELECT ASSET</div>}
                </div>

                <div className="flex-1 bg-[#0d0d0d] border border-zinc-800 overflow-y-auto">
                   <div className="p-3 bg-black text-[10px] font-black uppercase text-zinc-500 sticky top-0 border-b border-zinc-800 z-10 flex justify-between">
                     <span>Active Contracts</span>
                     <span>{portfolio.length} Open</span>
                   </div>
                   <table className="w-full text-left text-[10px]">
                     <thead>
                       <tr className="text-zinc-600 border-b border-zinc-800">
                         <th className="p-3">ASSET</th>
                         <th className="p-3">RISK (TP/SL)</th>
                         <th className="p-3">TIME LEFT</th>
                         <th className="p-3 text-right">ACTION</th>
                       </tr>
                     </thead>
                     <tbody>
                       {portfolio.length === 0 ? (
                         <tr><td colSpan={4} className="p-6 text-center text-zinc-600 uppercase font-black">No Active Contracts</td></tr>
                       ) : portfolio.map((p) => {
                         const liveAsset = stocks.find(s => s.symbol === p.symbol);
                         const currentAssetPrice = liveAsset ? liveAsset.price : p.entryPrice;
                         const currentValue = p.qty * currentAssetPrice;
                         
                         const pnl = p.side === 'buy' ? currentValue - p.invested : p.invested - currentValue;
                         
                         const secondsLeft = Math.max(0, Math.floor((p.expiresAt - currentTime) / 1000));
                         const timeColor = secondsLeft < 10 ? 'text-red-500 animate-pulse' : 'text-yellow-500';

                         return (
                           <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-900">
                             <td className="p-3">
                               <p className="font-bold text-white flex items-center gap-2">
                                 {p.symbol}
                                 <span className={`text-[8px] px-1 py-0.5 rounded-sm ${p.side === 'buy' ? 'bg-[#00ff41]/20 text-[#00ff41]' : 'bg-red-500/20 text-red-500'}`}>
                                   {p.side.toUpperCase()}
                                 </span>
                               </p>
                               <p className={`text-[9px] ${pnl >= 0 ? 'text-[#00ff41]' : 'text-red-500'}`}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USDT</p>
                             </td>
                             <td className="p-3 font-mono text-[9px] text-zinc-400">
                               <span className="text-green-500">TP: {p.tp || 'N/A'}</span><br/>
                               <span className="text-red-500">SL: {p.sl || 'N/A'}</span>
                             </td>
                             <td className={`p-3 font-black tabular-nums ${timeColor}`}>{secondsLeft}s</td>
                             <td className="p-3 text-right">
                               <button 
                                 onClick={() => liquidatePosition(p.id, "FORCE CLOSE")}
                                 disabled={p.isClosing}
                                 className="bg-red-900/40 border border-red-500 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1 font-black transition-colors shadow-[0_0_10px_rgba(220,38,38,0.2)]"
                               >
                                 {p.isClosing ? "CLOSING..." : "CLOSE"}
                               </button>
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                </div>
              </div>

              <div className="w-1/4 flex flex-col gap-4">
                <div className="bg-[#0d0d0d] border border-zinc-800 p-4 relative overflow-hidden">
                  <h3 className="text-[#00ff41] font-black uppercase text-[10px] tracking-widest mb-3 flex items-center"><span className="w-2 h-2 bg-[#00ff41] rounded-full mr-2 animate-pulse"></span> AI Analysis</h3>
                  <div className="bg-black border border-zinc-800 p-3 min-h-[90px] font-mono text-[10px] text-zinc-300 shadow-inner">{aiAnalysis}</div>
                </div>

                <div className="flex-1 bg-[#0d0d0d] border border-zinc-800 p-6 flex flex-col">
                  <h3 className="text-white font-black uppercase text-sm mb-4 border-b border-zinc-800 pb-2">Order Entry: <span className="text-[#00ff41]">{selectedAsset?.symbol}</span></h3>
                  
                  {!user?.hasActiveSubscription ? (
                    <div className="bg-red-900/20 border border-red-500/50 p-4 text-center mt-auto mb-auto">
                      <p className="text-red-400 text-[10px] font-black uppercase">Execution Locked.</p>
                      <button onClick={() => setActiveTab("licenses")} className="mt-2 text-[10px] font-black bg-red-600 text-white px-4 py-2 hover:bg-red-500">Go to Licenses</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* TRADE AMOUNT */}
                      <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase mb-1 block">Trade Size (USDT)</label>
                        <input type="number" value={tradeAmount} onChange={(e) => setTradeAmount(Number(e.target.value))} className="w-full bg-black border border-zinc-800 text-white p-2 font-mono outline-none focus:border-[#00ff41]" />
                      </div>

                      {/* DURATION */}
                      <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase mb-1 block">Expiry Duration (Seconds)</label>
                        <input type="number" value={tradeDuration} onChange={(e) => setTradeDuration(Number(e.target.value))} placeholder="60" className="w-full bg-black border border-zinc-800 text-white p-2 font-mono outline-none focus:border-[#00ff41]" />
                      </div>

                      {/* RISK MANAGEMENT: TP & SL */}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-green-500 uppercase mb-1 block">Take Profit</label>
                          <input type="number" placeholder="Optional" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value !== "" ? Number(e.target.value) : "")} className="w-full bg-black border border-green-900/50 text-green-400 p-2 font-mono outline-none focus:border-green-500 text-[10px]" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-red-500 uppercase mb-1 block">Stop Loss</label>
                          <input type="number" placeholder="Optional" value={stopLoss} onChange={(e) => setStopLoss(e.target.value !== "" ? Number(e.target.value) : "")} className="w-full bg-black border border-red-900/50 text-red-400 p-2 font-mono outline-none focus:border-red-500 text-[10px]" />
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <button onClick={() => autofillRisk('long')} className="text-[9px] text-zinc-500 hover:text-[#00ff41] font-black tracking-widest uppercase transition-colors">Auto-fill Long</button>
                        <button onClick={() => autofillRisk('short')} className="text-[9px] text-zinc-500 hover:text-red-500 font-black tracking-widest uppercase transition-colors">Auto-fill Short</button>
                      </div>

                      {/* OMNI-DIRECTIONAL EXECUTION BUTTONS */}
                      <div className="mt-auto pt-4 border-t border-zinc-800 flex gap-4">
                        <button onClick={() => openPosition('buy')} className="flex-1 bg-[#00ff41] text-black font-black uppercase p-3 hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all">LONG</button>
                        <button onClick={() => openPosition('sell')} className="flex-1 border border-red-500 text-red-500 font-black uppercase p-3 hover:bg-red-900/20 transition-all shadow-[0_0_10px_rgba(220,38,38,0.1)]">SHORT</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: LICENSES */}
          {activeTab === "licenses" && (
            <div className="max-w-4xl animate-in slide-in-from-bottom-4">
              <p className="text-zinc-400 text-sm font-bold mb-8">Purchase an institutional license to unlock the Quant AI and live execution engines.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`p-8 border-2 transition-all ${user?.hasActiveSubscription && !user?.b2bKeys?.length ? 'border-[#00ff41] bg-[#00ff41]/5' : 'border-zinc-800 bg-[#0d0d0d]'}`}>
                  <h3 className="text-2xl font-black uppercase mb-2 text-white">Retail Terminal</h3>
                  <p className="text-3xl font-black text-[#00ff41] mb-6">$20.00</p>
                  <ul className="text-xs text-zinc-400 space-y-3 font-bold mb-8">
                    <li>✓ Live Market Data</li>
                    <li>✓ Simulated Execution</li>
                    <li>✓ Basic AI Analysis</li>
                  </ul>
                  {user?.hasActiveSubscription ? (
                    <button disabled className="w-full border border-[#00ff41] text-[#00ff41] py-3 font-black uppercase opacity-50">Active</button>
                  ) : (
                    <button onClick={() => setCheckoutTier("RETAIL")} className="w-full bg-[#00ff41] text-black py-3 font-black uppercase hover:shadow-[0_0_15px_rgba(0,255,65,0.4)]">Purchase via Crypto</button>
                  )}
                </div>

                <div className={`p-8 border-2 transition-all ${user?.b2bKeys?.length ? 'border-yellow-400 bg-yellow-400/5' : 'border-zinc-800 bg-black shadow-[10px_10px_0_#00ff41]'}`}>
                  <h3 className="text-2xl font-black uppercase mb-2 text-yellow-400">Enterprise B2B</h3>
                  <p className="text-3xl font-black text-white mb-6">$500.00</p>
                  <ul className="text-xs text-zinc-400 space-y-3 font-bold mb-8">
                    <li>✓ All Retail Features</li>
                    <li>✓ API Key Generation</li>
                    <li>✓ White-label Permissions</li>
                  </ul>
                  {user?.b2bKeys?.length ? (
                    <div className="bg-yellow-400 text-black text-center py-3 font-black uppercase">Enterprise Active</div>
                  ) : (
                    <button onClick={() => setCheckoutTier("B2B")} className="w-full bg-white text-black py-3 font-black uppercase hover:bg-yellow-400">Purchase License</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ADMIN WATCHTOWER */}
          {activeTab === "watchtower" && (
             <div className="border border-red-900/50 bg-black animate-in fade-in">
              <div className="bg-red-900/20 p-4 border-b border-red-900/50 flex justify-between">
                <span className="text-red-500 text-xs font-black uppercase">Admin Master Ledger</span>
                <span className="text-red-500 text-[10px] animate-pulse">● LIVE</span>
              </div>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-zinc-600 border-b border-zinc-900"><th className="p-4">USER</th><th className="p-4">EVENT</th><th className="p-4 text-right">VALUE</th></tr>
                </thead>
                <tbody>
                  {adminLogs.map((log, i) => (
                    <tr key={i} className="border-b border-zinc-900/50"><td className="p-4 font-bold text-white">{log.userEmail}</td><td className="p-4 uppercase text-zinc-400">{log.type}</td><td className={`p-4 text-right font-black ${log.amount < 0 ? 'text-zinc-500' : 'text-[#00ff41]'}`}>{log.amount}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>
      
      {/* GLOBAL MODAL: CRYPTO CHECKOUT */}
      {checkoutTier && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-[#00ff41] p-10 max-w-lg w-full">
            <h2 className="text-2xl font-black uppercase mb-6 italic text-[#00ff41]">Crypto Gateway</h2>
            <p className="text-[10px] font-bold mb-2 text-zinc-500 uppercase">Transfer {checkoutTier === 'B2B' ? '$500' : '$20'} USDT (Polygon) to:</p>
            <div className="bg-black p-4 border border-zinc-800 text-[11px] mb-8 font-black text-white select-all">0xYourPolygonWalletAddressHere</div>
            <input type="text" placeholder="PASTE TXID" value={txIdInput} onChange={(e) => setTxIdInput(e.target.value)} className="w-full p-4 border border-zinc-800 mb-8 font-black uppercase bg-black text-[#00ff41] outline-none focus:border-[#00ff41]" />
            <div className="flex gap-4">
              <button onClick={() => setCheckoutTier(null)} className="flex-1 border border-zinc-800 py-4 font-black uppercase text-[10px] hover:text-red-500">Cancel</button>
              <button className="flex-1 bg-[#00ff41] text-black py-4 font-black uppercase text-[10px]">Verify TxID</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}