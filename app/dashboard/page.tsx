"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("terminal");
  const [isLoading, setIsLoading] = useState(true);

  // Market Simulator State
  const [marketAssets, setMarketAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [tradeAmount, setTradeAmount] = useState<string>("1000");
  const [algoSignal, setAlgoSignal] = useState<any>(null);

  // AI Oracle State
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Admin State
  const [targetBanEmail, setTargetBanEmail] = useState("");
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user && user.subscriptionTier !== "none") {
      fetchMarketData();
      const interval = setInterval(fetchMarketData, 4000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Corrected matching the precise server route structure (/api/users/profile)
      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem("token");
        router.push("/login");
      }
    } catch (error) {
      console.error("Identity collection failure:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/market/stream`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMarketAssets(data);
        if (!selectedAsset && data.length > 0) setSelectedAsset(data[0]);
      }
    } catch (e) { console.error("Telemetry link lost."); }
  };

  const fetchPredictiveSignal = async (symbol: string) => {
    try {
      const encoded = encodeURIComponent(symbol);
      const res = await fetch(`${API_URL}/api/ai/inbuilt/predict/${encoded}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAlgoSignal(data);
      }
    } catch (e) { console.error("Algo engine isolated."); }
  };

  const handleExecuteTrade = async (side: "buy" | "sell") => {
    if (!selectedAsset) return;
    try {
      const res = await fetch(`${API_URL}/api/trade/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ symbol: selectedAsset.symbol, side, amount: Number(tradeAmount) })
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev: any) => ({ ...prev, demoBalance: data.newBalance }));
        alert("Trade order confirmed and executed.");
      } else {
        alert(`Execution Denied: ${data.error}`);
      }
    } catch (e) { alert("Core gateway timeout error."); }
  };

  const handleBanUser = async (targetEmail: string) => {
    if (!targetEmail) return;
    
    // Explicit protection layout directly on the client side
    if (targetEmail.trim() === "nicholausdominic86@gmail.com" || targetEmail.trim() === user?.email) {
      alert("[OPERATION ABORTED]: System security safeguards prevent terminating corporate root admin entities.");
      return;
    }

    if (!confirm(`Confirm complete operational termination of profile account identity: ${targetEmail}?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/ban`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ targetEmail: targetEmail.trim() })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`User assigned identity ${targetEmail} access revoked.`);
        setTargetBanEmail("");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (e) {
      alert("Error reaching watchtower administrative core endpoints.");
    }
  };

  const askOracle = async () => {
    if (!aiQuestion) return;
    setIsAiLoading(true);
    setAiResponse("");

    try {
      // Maps seamlessly onto our Node script endpoint route layout
      const res = await fetch(`${API_URL}/api/ai/openai/tutor`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ question: aiQuestion })
      });

      const data = await res.json();
      // Handles extracting response payload variables reliably
      setAiResponse(data.tutorResponse);
    } catch (error) {
      setAiResponse("[CRITICAL ERROR] Failed to connect with neural core infrastructure.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const processLicenseGeneration = async () => {
    try {
      const res = await fetch(`${API_URL}/api/payment/create-invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ tier: "RETAIL" })
      });
      const data = await res.json();
      if (res.ok && data.invoice_url) {
        window.open(data.invoice_url, "_blank");
      } else {
        alert("Failed to compute crypto checkout interface invoice layout.");
      }
    } catch (e) { alert("Billing transaction pipelines disconnected."); }
  };

  const isAdmin = user?.role === "admin" || user?.email === "nicholausdominic86@gmail.com";
  const isLocked = user?.subscriptionTier === "none" && !isAdmin;

  if (isLoading) return <div className="min-h-screen bg-black text-green-500 flex items-center justify-center font-mono tracking-widest text-sm animate-pulse">CONNECTING TO NN-FINTECH NETWORK SYSTEM NODE STATUS...</div>;

  if (isLocked) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center font-mono p-4 tracking-tight">
        <div className="border border-red-900 p-8 max-w-xl bg-black text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-widest">[ SECURITY REJECTION: ACCESS LOCKOUT ]</h1>
          <p className="text-sm text-gray-400">Account token structure validated, but no active cryptographic node license subscription detected on record.</p>
          <div className="pt-4">
            <button 
              onClick={processLicenseGeneration}
              className="px-6 py-3 bg-red-950 text-red-400 border border-red-600 font-bold hover:bg-red-500 hover:text-black transition-all text-sm tracking-widest w-full"
            >
              PROVISION SYSTEM RETAIL LICENSE KEY ($20.00 / MO)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-gray-300 font-mono flex flex-col selection:bg-green-500 selection:text-black">
      <header className="border-b border-gray-900 p-4 flex justify-between items-center bg-black">
        <div className="flex items-center space-x-6">
          <span className="text-green-500 font-bold tracking-widest text-sm">NN-FINTECH LAYER_STATUS // OPERATIONAL</span>
          <span className="text-xs text-gray-500 bg-gray-950 px-3 py-1 border border-gray-800 rounded-none">CAPACITY: {isAdmin ? "ROOT SUPER USER" : user?.subscriptionTier?.toUpperCase()}</span>
          <span className="text-xs text-green-400 bg-gray-950 px-3 py-1 border border-gray-800">SIM_LIQUIDITY: ${user?.demoBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <button onClick={() => { localStorage.removeItem("token"); router.push("/login"); }} className="text-xs border border-red-900 text-red-500 px-3 py-1 hover:bg-red-950/30 transition-all">
          DISCONNECT_NODE
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-gray-900 bg-black p-4 flex flex-col space-y-1">
          <button onClick={() => setActiveTab("terminal")} className={`text-left p-3 text-xs tracking-wider border ${activeTab === "terminal" ? "border-green-600 text-green-400 bg-green-950/10" : "border-transparent text-gray-600 hover:text-gray-400"}`}>&gt; SIMULATOR_TERMINAL</button>
          <button onClick={() => setActiveTab("academy")} className={`text-left p-3 text-xs tracking-wider border ${activeTab === "academy" ? "border-green-600 text-green-400 bg-green-950/10" : "border-transparent text-gray-600 hover:text-gray-400"}`}>&gt; AI_NEURAL_ORACLE</button>
          {isAdmin && (
            <button onClick={() => setActiveTab("admin")} className={`text-left p-3 text-xs tracking-wider border mt-auto ${activeTab === "admin" ? "border-purple-600 text-purple-400 bg-purple-950/10" : "border-transparent text-gray-600 hover:text-gray-400"}`}>&gt; SECURITY_WATCHTOWER</button>
          )}
        </aside>

        <main className="flex-1 p-6 overflow-y-auto bg-neutral-950">
          
          {activeTab === "terminal" && (
            <div className="grid grid-cols-3 gap-6 h-full min-h-[500px]">
              <div className="col-span-2 border border-gray-900 bg-black p-4 flex flex-col justify-between">
                <div className="flex justify-between items-center border-b border-gray-900 pb-2 mb-4">
                  <span className="text-xs font-bold text-gray-400">MARKET FEED (LIVE SIMULATED TICKER UPDATE)</span>
                  {selectedAsset && <span className="text-xs text-green-500 font-bold">{selectedAsset.symbol} : ${selectedAsset.price} ({selectedAsset.change})</span>}
                </div>
                <div className="flex-1 overflow-y-auto max-h-[300px] mb-4 space-y-1 pr-2">
                  {marketAssets.map((asset) => (
                    <div 
                      key={asset.symbol} 
                      onClick={() => { setSelectedAsset(asset); fetchPredictiveSignal(asset.symbol); }}
                      className={`flex justify-between p-2 text-xs cursor-pointer border ${selectedAsset?.symbol === asset.symbol ? "border-green-800 bg-neutral-900" : "border-transparent hover:bg-neutral-900/50"}`}
                    >
                      <span className="text-gray-400 font-bold">{asset.symbol}</span>
                      <div className="space-x-4">
                        <span>${asset.price.toFixed(4)}</span>
                        <span className={asset.change.startsWith("+") ? "text-green-500" : "text-red-500"}>{asset.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-900 bg-black p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 border-b border-gray-900 pb-2 mb-4">ORDER DEPLOYMENT</h3>
                  <label className="text-[10px] text-gray-500 block mb-1">TRANSACTION ALLOCATION SIZE (USD)</label>
                  <input 
                    type="number" 
                    value={tradeAmount} 
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="w-full bg-neutral-950 border border-gray-800 p-2 text-xs text-white mb-4 focus:outline-none focus:border-green-600"
                  />
                  {algoSignal && (
                    <div className="border border-neutral-900 p-3 bg-neutral-950 mb-4 text-[11px] space-y-1">
                      <p className="text-gray-500 font-bold">NODE SYSTEM QUANT ALGO TELEMETRY:</p>
                      <p>SIGNAL OUTCOME: <span className="text-green-400 font-bold">{algoSignal.signal}</span></p>
                      <p>MOVING AVERAGE BASIS: ${algoSignal.movingAverage}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleExecuteTrade("buy")} className="bg-green-950/40 border border-green-600 text-green-400 hover:bg-green-500 hover:text-black transition-all p-3 text-xs font-bold tracking-widest">DEPLOY LONG</button>
                  <button onClick={() => handleExecuteTrade("sell")} className="bg-red-950/40 border border-red-600 text-red-400 hover:bg-red-500 hover:text-black transition-all p-3 text-xs font-bold tracking-widest">DEPLOY SHORT</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "academy" && (
            <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)]">
              <h2 className="text-xs text-green-500 mb-4 font-bold tracking-widest">NEURAL ORACLE REASONING MATRIX GRID // CORE VIA GEMINI</h2>
              <div className="flex-1 border border-gray-900 bg-black p-4 mb-4 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-gray-400">
                {aiResponse ? (
                  <span className={aiResponse.includes("[SYSTEM ERROR]") ? "text-red-500 font-bold" : "text-green-400"}>
                    {aiResponse}
                  </span>
                ) : (
                  <span className="text-gray-600">[Awaiting execution inquiry inputs. Matrix pipeline channel open.]</span>
                )}
              </div>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Inquire technical strategy metrics, market risk mechanics, macro framework variables..."
                  className="flex-1 bg-black border border-gray-800 p-3 text-xs text-white focus:outline-none focus:border-green-600 rounded-none"
                  onKeyDown={(e) => e.key === "Enter" && !isAiLoading && askOracle()}
                />
                <button 
                  onClick={askOracle}
                  disabled={isAiLoading || !aiQuestion}
                  className="bg-neutral-900 border border-gray-700 text-xs px-6 hover:bg-green-600 hover:text-black transition-all font-bold disabled:opacity-30 disabled:hover:bg-neutral-900 disabled:hover:text-gray-500 text-white"
                >
                  {isAiLoading ? "PROCESSING..." : "COMPUTE"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "admin" && isAdmin && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-xs text-purple-500 font-bold tracking-widest border-b border-purple-950 pb-2">WATCHTOWER SUPERADMIN OVERRIDE MATRIX</h2>
              <div className="bg-black border border-purple-900/40 p-6 space-y-4">
                <h3 className="text-purple-400 text-xs font-bold tracking-wider">REVOKE IDENTITY SUBSCRIPTION NODE PRIVILEGES</h3>
                <p className="text-[11px] text-gray-500">Executing a revocation fully flags user accounts as inactive, rejecting login handshake authentication mechanisms.</p>
                <div className="flex space-x-2">
                  <input 
                    type="email" 
                    value={targetBanEmail}
                    onChange={(e) => setTargetBanEmail(e.target.value)}
                    placeholder="operator_account_identity@mail.com"
                    className="flex-1 bg-neutral-950 border border-gray-800 p-2 text-xs text-white focus:outline-none focus:border-purple-600"
                  />
                  <button 
                    onClick={() => handleBanUser(targetBanEmail)}
                    className="bg-red-950/40 border border-red-600 text-red-400 px-6 py-2 hover:bg-red-600 hover:text-black transition-all text-xs font-bold"
                  >
                    TERMINATE ACCESS
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}