"use client";
import { useState, useEffect, useRef } from "react";
import { IChartApi, ISeriesApi } from "lightweight-charts";
import {
  attachChartResizeListener,
  createCandlestickChart,
  generateSimulatedHistory,
  morphLiveCandle,
} from "@/app/lib/charts";
import { requestGet, requestPostJson } from "@/app/lib/api";
import { changeColorClass, formatUsdAmount } from "@/app/lib/formatting";
import { usePolling } from "@/app/lib/polling";

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

    const { chart, series: candleSeries } = createCandlestickChart(chartContainerRef.current, {
      height: 500,
      backgroundColor: "#09090b",
      textColor: "#a1a1aa",
      gridColor: "#27272a",
      timeVisible: true,
      secondsVisible: true,
      crosshairMode: 1,
      upColor: "#22c55e",
      downColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    const basePrice = activeAsset === "BTC" ? 68000 : activeAsset === "NN-GOLD" ? 2300 : activeAsset === "TSLA" ? 175 : 180;
    const history = generateSimulatedHistory({
      basePrice,
      count: 100,
      barInterval: 60,
      openVolatility: 0,
      closeVolatility: 0.005,
      highVolatility: 0.002,
      lowVolatility: 0.002,
      volatilityReference: "current",
    });
    candleSeries.setData(history);
    currentBarRef.current = history[history.length - 1];

    const removeResizeListener = attachChartResizeListener(chart, chartContainerRef.current);

    return () => {
      removeResizeListener();
      chart.remove();
    };
  }, [activeAsset]); 

  // --- 2. LIVE MARKET SYNCHRONIZATION ---
  const fetchMarketData = async () => {
    try {
      const stockResult = await requestGet<any[]>("/api/market/stocks");
      if (stockResult.ok) {
          const liveStocks = stockResult.data || [];
          setStocks(liveStocks);

          const activeStockData = liveStocks.find((s: any) => s.symbol === activeAsset);
          if (activeStockData && seriesRef.current && currentBarRef.current) {
              const livePrice = activeStockData.price;
              const currentBar = morphLiveCandle(currentBarRef.current, livePrice, true);
              seriesRef.current.update(currentBar);
              currentBarRef.current = currentBar;
          }
      }

      const accountResult = await requestGet<{ demoBalance: number }>("/api/account/balance");
      if (accountResult.ok) {
          setDemoBalance(accountResult.data?.demoBalance || 0);
      }
    } catch (err) {
      console.error("Market fetch failed", err);
    }
  };

  usePolling(fetchMarketData, 5000, [activeAsset]);

  // --- 3. EXECUTION ENGINE ---
  const executePaperTrade = async () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) return alert("Enter valid capital.");

    setLoading(true);
    try {
      const result = await requestPostJson<{ demoBalance: number; error?: string }>("/api/trade/execute", { symbol: activeAsset, amount: tradeAmount });
      if (result.ok) {
        setDemoBalance(result.data?.demoBalance || 0);
        setTradeAmount("");
      } else {
        alert(`TRADE REJECTED: ${result.data?.error}`);
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
              ${formatUsdAmount(demoBalance || 0, { minimumFractionDigits: 2 })}
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
                            <span className={`text-lg font-bold ${changeColorClass(activeStockDetails.change || "0.00%", 'text-green-500', 'text-red-500', true)}`}>
                                ${formatUsdAmount(activeStockDetails.price)} ({activeStockDetails.change || "0.00%"})
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
                                <span className={`text-sm ${changeColorClass(stock.change || "0.00%", 'text-green-500', 'text-red-500', true)}`}>
                                    ${formatUsdAmount(stock.price)}
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