"use client";

import { useState, useEffect } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { requestGet, requestPostJson } from "@/app/lib/api";
import { formatUsdAmount } from "@/app/lib/formatting";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("10.00");

  const updateBalance = async () => {
    const result = await requestGet<{ balance?: number }>("/api/account/balance");
    setBalance(result.data?.balance || 0);
  };

  useEffect(() => { updateBalance(); }, []);

  return (
    <div className="p-8 space-y-8 bg-white min-h-screen font-sans">
      <div className="border-8 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-5xl font-black uppercase italic">Capital Vault</h1>
        <p className="text-4xl font-mono text-green-600 font-bold mt-4">
          ${formatUsdAmount(balance, { grouping: false })}
        </p>
      </div>

      <div className="max-w-md border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <label className="block text-xs font-black uppercase mb-2">Injection Amount (USD)</label>
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border-4 border-black mb-6 font-mono text-xl outline-none focus:bg-yellow-50"
        />

        <PayPalScriptProvider options={{ 
            clientId: "ASSLKTkkkGZUWVOgHp9zrtdqCZTr_Mw2KURxit5dnCmKOJZhoJlnGoIfykIWicat1hAz91d4lTj5jp5D", 
            currency: "USD",
            intent: "capture"
        }}>
          <PayPalButtons 
            forceReRender={[amount]}
            style={{ layout: "vertical", color: "black", shape: "rect" }}
            createOrder={async () => {
              const result = await requestPostJson<{ id: string }>("/api/paypal/create-order", { amount });
              return result.data?.id || "";
            }}
            onApprove={async (data) => {
              const result = await requestPostJson("/api/paypal/capture-order", { orderID: data.orderID });
              if (result.ok) {
                alert("CAPITAL SECURED.");
                updateBalance();
              }
            }}
          />
        </PayPalScriptProvider>
      </div>
    </div>
  );
}