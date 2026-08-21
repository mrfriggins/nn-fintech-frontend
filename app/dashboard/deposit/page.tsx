"use client";
import { useState, useEffect } from "react";
import { apiFetch, errorMessage, logError } from "../../lib/api";

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [lockedAmount, setLockedAmount] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState("");

  // 1. DYNAMICALLY INJECT THE PAYPAL SECURE SCRIPT
  useEffect(() => {
    if (document.querySelector("#paypal-script")) {
        setScriptLoaded(true);
        return;
    }
    
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError("Payment gateway is not configured (NEXT_PUBLIC_PAYPAL_CLIENT_ID missing).");
      return;
    }

    const script = document.createElement("script");
    script.id = "paypal-script";
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      // Without this the page would sit on an empty gateway area forever.
      script.remove();
      setError("Payment gateway script failed to load. Check your connection and retry.");
    };
    document.body.appendChild(script);
  }, []);

  // 2. LOCK THE CAPITAL AMOUNT
  const lockCapital = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val < 1) {
      setError("Minimum institutional deposit is $1.00 USD.");
      return;
    }
    setError("");
    setLockedAmount(val.toFixed(2));
  };

  // 3. SUMMON THE SECURE GATEWAY (Bypassing TypeScript with "as any")
  useEffect(() => {
    if (scriptLoaded && lockedAmount && (window as any).paypal) {
      const container = document.getElementById("paypal-button-container");
      if (container) container.innerHTML = ""; // Purge old instances to prevent crashes

      (window as any).paypal.Buttons({
        style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'pay' },
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{ amount: { value: lockedAmount } }]
          });
        },
        onApprove: async (data: any) => {
          // Send the authorization to your backend vault to verify and capture
          try {
            await apiFetch("/api/deposit/capture", {
              method: "POST",
              body: JSON.stringify({ orderID: data.orderID })
            });
            setError("");
            alert("CAPITAL SECURED: Real Vault Liquidity Updated.");
            window.location.href = "/dashboard";
          } catch (err) {
            logError("deposit capture failed", err);
            setError(
              `SECURITY ALERT: ${errorMessage(err, "Transaction verification failed.")} Order ${data.orderID} was approved but not captured — keep this reference.`
            );
          }
        },
        onError: (err: unknown) => {
          logError("paypal sdk error", err);
          setError("Payment gateway error. No funds were moved.");
        }
      }).render("#paypal-button-container");
    }
  }, [scriptLoaded, lockedAmount]);

  return (
    <div className="max-w-xl mx-auto space-y-8 font-mono text-black">
      
      <div className="bg-black text-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <h1 className="text-4xl font-black uppercase italic">Fund Vault</h1>
        <p className="text-zinc-400 font-bold text-xs mt-2 uppercase">1:1 Fiat Backed Real Capital Integration</p>
      </div>

      {error && (
        <div className="bg-red-100 border-4 border-red-600 text-red-700 p-4 font-black uppercase text-xs">
          {error}
        </div>
      )}

      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {!lockedAmount ? (
          <form onSubmit={lockCapital} className="space-y-6">
            <div>
                <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Deposit Amount (USD)</label>
                <div className="flex items-center border-4 border-black focus-within:border-yellow-400 transition-all">
                    <span className="px-4 text-2xl font-black bg-zinc-100 border-r-4 border-black h-full py-4">$</span>
                    <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        required
                        className="w-full p-4 text-3xl font-black outline-none"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
            </div>
            <button type="submit" className="w-full bg-black text-white font-black py-4 uppercase border-4 border-black hover:bg-white hover:text-black transition-all active:scale-95">
              Secure Amount & Proceed
            </button>
          </form>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-zinc-100 border-4 border-black p-4 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500">Locked Amount</p>
                    <p className="text-3xl font-black">${lockedAmount}</p>
                </div>
                <button 
                    onClick={() => setLockedAmount("")} 
                    className="text-xs font-black uppercase border-b-2 border-black hover:text-red-600 hover:border-red-600"
                >
                    Modify
                </button>
            </div>
            
            <p className="text-[10px] font-bold text-zinc-500 uppercase text-center">Select Payment Gateway</p>
            
            {/* PAYPAL SDK TARGET RENDER AREA */}
            <div id="paypal-button-container" className="min-h-[150px]"></div>
          </div>
        )}
      </div>

    </div>
  );
}