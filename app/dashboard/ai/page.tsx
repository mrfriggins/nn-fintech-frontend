"use client";
import { useState, useEffect } from "react";

export default function AiTerminal() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  // Fetch the available assets from the market engine
  useEffect(() => {
    const fetchMarket = async () => {
      const res = await fetch("http://localhost:8080/api/market/stocks", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        const assetList = data.map((s: any) => s.symbol);
        setSymbols(assetList);
        if (assetList.length > 0) setSelectedAsset(assetList[0]);
      }
    };
    fetchMarket();
  }, []);

  const runQuantModel = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await fetch("http://localhost:8080/api/ai/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ symbol: selectedAsset })
      });
      if (res.ok) {
        setAnalysis(await res.json());
      } else {
        // We pull the exact error message from the backend instead of guessing
        const errorData = await res.json();
        alert(`SYSTEM REJECTION: ${errorData.error || "Unknown Error"}`);
      }
    } catch (err) {
      alert("AI MAINFRAME OFFLINE.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-mono text-black">
      
      {/* HEADER */}
      <div className="bg-black text-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <h1 className="text-4xl font-black uppercase italic">NN-Quant AI</h1>
        <p className="text-zinc-400 font-bold text-xs mt-2 uppercase flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Algorithmic Prediction Engine Online
        </p>
      </div>

      {/* INPUT CONSOLE */}
      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <label className="block text-xs font-black uppercase text-zinc-500 mb-4">Target Asset Designation</label>
        <div className="flex flex-col md:flex-row gap-4">
            <select 
                className="flex-1 p-4 border-4 border-black text-xl font-black uppercase outline-none focus:bg-zinc-50 cursor-pointer"
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
            >
                {symbols.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button 
                onClick={runQuantModel}
                disabled={loading}
                className="bg-black text-white px-8 py-4 font-black uppercase border-4 border-black hover:bg-white hover:text-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "INITIALIZING NEURAL NET..." : "Execute Quant Scan"}
            </button>
        </div>
      </div>

      {/* OUTPUT HUD */}
      {analysis && (
        <div className="bg-zinc-100 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-6">Analysis Report: {analysis.symbol}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border-4 border-black p-4">
                    <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Current Tick Price</p>
                    <p className="text-3xl font-black tabular-nums">${analysis.currentPrice.toLocaleString()}</p>
                </div>
                <div className={`border-4 border-black p-4 ${analysis.recommendation.includes('BUY') ? 'bg-green-100' : analysis.recommendation.includes('SELL') ? 'bg-red-100' : 'bg-yellow-100'}`}>
                    <p className="text-[10px] font-black uppercase text-black mb-1">System Directive</p>
                    <p className="text-3xl font-black">{analysis.recommendation}</p>
                </div>
            </div>

            <div className="bg-black text-green-400 p-6 font-mono text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                <p className="font-black text-white mb-2 uppercase text-xs border-b border-zinc-700 pb-2">&gt;_ Quant Reasoning Output</p>
                <p className="leading-relaxed">{analysis.reasoning}</p>
                <p className="mt-4 text-xs font-black text-zinc-500">CONFIDENCE METRIC: <span className="text-white">{analysis.confidence}</span></p>
            </div>
        </div>
      )}

    </div>
  );
}