"use client";
import { useState, useEffect, useRef } from "react";
// Added IChartApi and ISeriesApi to satisfy TypeScript's strict mode
import { createChart, ColorType, CandlestickSeries, Time, IChartApi, ISeriesApi } from "lightweight-charts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function TradeTerminal() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [demoBalance, setDemoBalance] = useState(0);
  const [tradeAmount, setTradeAmount] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [activeAsset, setActiveAsset] = useState("BTC");
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const currentBarRef = useRef<any>(null);

  // --- 1. THE TRADINGVIEW CHART INITIALIZATION ---
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "#09090b" }, textColor: "#a1a1aa" },
      grid: { vertLines: { color: "#27272a" }, horzLines: { color: "#27272a" } },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      crosshair: { mode: 1 },
      timeScale: { timeVisible: true, secondsVisible: true },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    const generateHistory = () => {
      let data = [];
      // STRICT FIX: Time must be a raw Unix timestamp (seconds), NOT a string or milliseconds
      let timeInSeconds = Math.floor(Date.now() / 1000) - (100 * 60); 
      let price = activeAsset === "BTC" ? 68000 : activeAsset === "NN-GOLD" ? 2300 : activeAsset === "TSLA" ? 175 : 180;
      
      for(let i=0; i<100; i++) {
          let open = price;
          let close = price + (Math.random() - 0.5) * (price * 0.005);
          let high = Math.max(open, close) + Math.random() * (price * 0.002);
          let low = Math.min(open, close) - Math.random() * (price * 0.002);
          
          // Cast the integer strictly as Time
          const timestamp = (timeInSeconds + (i * 60)) as Time;
          data.push({ time: timestamp, open, high, low, close });
          price = close;
      }
      return data;
    };

    const history = generateHistory();
    candleSeries.setData(history);
    currentBarRef.current = history[history.length - 1];

    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [activeAsset]); 

  // --- 2. LIVE MARKET SYNCHRONIZATION ---
  const fetchMarketData = async () => {
    const headers = { "Authorization": `Bearer ${localStorage.getItem("token")}` };
    
    try {
      const stockRes = await fetch("${API_URL}/api/market/stocks", { headers });
      if (stockRes.ok) {
          const liveStocks = await stockRes.json();
          setStocks(liveStocks);

          const activeStockData = liveStocks.find((s: any) => s.symbol === activeAsset);
          if (activeStockData && seriesRef.current && currentBarRef.current) {
              const livePrice = activeStockData.price;
              let currentBar = { ...currentBarRef.current };
              
              // STRICT FIX: Live time must also be an integer cast as Time
              currentBar.time = Math.floor(Date.now() / 1000) as Time;
              
              currentBar.close = livePrice;
              currentBar.high = Math.max(currentBar.high, livePrice);
              currentBar.low = Math.min(currentBar.low, livePrice);
              
              seriesRef.current.update(currentBar);
              currentBarRef.current = currentBar;
          }
      }

      const accRes = await fetch("${API_URL}/api/account/balance", { headers });
      if (accRes.ok) {
          const data = await accRes.json();
          setDemoBalance(data.demoBalance);
      }
    } catch (err) {
      console.error("Market fetch failed", err);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000); 
    return () => clearInterval(interval);
  }, [activeAsset]);

  // --- 3. EXECUTION ENGINE ---
  const executePaperTrade = async () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) return alert("Enter valid capital.");

    setLoading(true);
    try {
      const res = await fetch("${API_URL}/api/trade/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ symbol: activeAsset, amount: tradeAmount }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setDemoBalance(data.demoBalance);
        setTradeAmount("");
      } else {
        alert(`TRADE REJECTED: ${data.error}`);
      }
    } catch (err) { 
      alert("Terminal Error."); 
    } finally { 
      setLoading(false); 
    }
  };

  const activeStockDetails = stocks.find(s => s.symbol === activeAsset);

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 font-mono text-white">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex justify-between items-end border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-100">Pro Terminal</h1>
            <p className="font-bold text-zinc-500 uppercase text-xs">Simulated Institutional Environment</p>
          </div>
          <div className="text-right">
            <p className="font-bold uppercase text-zinc-500 text-xs">Purchasing Power (USD):</p>
            <p className="text-2xl font-black text-green-500 tabular-nums">
              ${(demoBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* LEFT: THE CHART */}
            <div className="lg:col-span-3 bg-zinc-950 border border-zinc-800">
                <div className="flex justify-between items-center p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black">{activeAsset} / USD</h2>
                        {activeStockDetails && (
                            <span className={`text-lg font-bold ${activeStockDetails.change?.includes('-') ? 'text-red-500' : 'text-green-500'}`}>
                                ${activeStockDetails.price.toLocaleString()} ({activeStockDetails.change || "0.00%"})
                            </span>
                        )}
                    </div>
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                </div>
                
                <div ref={chartContainerRef} className="w-full" />
            </div>

            {/* RIGHT: ORDER BOOK & EXECUTION PANEL */}
            <div className="lg:col-span-1 flex flex-col gap-6">
                
                <div className="bg-zinc-950 border border-zinc-800 p-4">
                    <h3 className="font-black uppercase text-zinc-500 mb-4 text-xs">Select Market</h3>
                    <div className="space-y-2">
                        {stocks.map((stock, i) => (
                            <button 
                                key={i}
                                onClick={() => setActiveAsset(stock.symbol)}
                                className={`w-full text-left p-3 flex justify-between items-center border ${activeAsset === stock.symbol ? 'border-yellow-500 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-600'} transition-all`}
                            >
                                <span className="font-bold">{stock.symbol}</span>
                                <span className={`text-sm ${stock.change?.includes('-') ? 'text-red-500' : 'text-green-500'}`}>
                                    ${stock.price.toLocaleString()}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 p-4 flex-1">
                    <h3 className="font-black uppercase text-zinc-500 mb-4 text-xs">Order Execution</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase">Capital to Allocate</label>
                            <div className="flex bg-zinc-900 border border-zinc-800 mt-1 focus-within:border-yellow-500 transition-all">
                                <span className="p-3 text-zinc-500 font-bold">$</span>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="bg-transparent w-full font-bold outline-none tabular-nums"
                                    value={tradeAmount} 
                                    onChange={(e) => setTradeAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-4 grid grid-cols-2 gap-2">
                            <button 
                                onClick={executePaperTrade}
                                disabled={loading} 
                                className="bg-green-600 text-white font-black py-4 uppercase hover:bg-green-500 active:scale-95 transition-all"
                            >
                                LONG (Buy)
                            </button>
                            <button 
                                onClick={executePaperTrade}
                                disabled={loading} 
                                className="bg-red-600 text-white font-black py-4 uppercase hover:bg-red-500 active:scale-95 transition-all"
                            >
                                SHORT (Sell)
                            </button>
                        </div>
                        <p className="text-[10px] text-zinc-600 font-bold text-center mt-4">Orders execute instantly at market price.</p>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}