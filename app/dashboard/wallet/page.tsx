"use client";

import { useState, useEffect } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { apiFetch, apiJson, readJson } from "../../lib/api";
import { parseAmount } from "../../lib/validation";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("10.00");

  const updateBalance = async () => {
    try {
      const res = await apiFetch("/api/account/balance");
      const data = res.ok ? await readJson(res) : null;
      setBalance(data?.balance || 0);
    } catch {
      setBalance(0);
    }
  };

  useEffect(() => { updateBalance(); }, []);

  return (
    <div className="p-8 space-y-8 bg-white min-h-screen font-sans">
      <div className="border-8 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-5xl font-black uppercase italic">Capital Vault</h1>
        <p className="text-4xl font-mono text-green-600 font-bold mt-4">
          ${balance.toFixed(2)}
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

        {!PAYPAL_CLIENT_ID ? (
          <p className="font-black uppercase text-xs text-red-600">
            Payment gateway unavailable: NEXT_PUBLIC_PAYPAL_CLIENT_ID is not configured.
          </p>
        ) : (
        <PayPalScriptProvider options={{ 
            clientId: PAYPAL_CLIENT_ID, 
            currency: "USD",
            intent: "capture"
        }}>
          <PayPalButtons 
            forceReRender={[amount]}
            style={{ layout: "vertical", color: "black", shape: "rect" }}
            createOrder={async () => {
              const normalizedAmount = parseAmount(amount);
              if (!normalizedAmount) throw new Error("Invalid deposit amount");
              const res = await apiJson("/api/paypal/create-order", { amount: normalizedAmount });
              const order = await readJson(res);
              if (!res.ok || !order?.id) throw new Error("Could not create order");
              return order.id;
            }}
            onApprove={async (data) => {
              const res = await apiJson("/api/paypal/capture-order", { orderID: data.orderID });
              if (res.ok) {
                alert("CAPITAL SECURED.");
                updateBalance();
              }
            }}
          />
        </PayPalScriptProvider>
        )}
      </div>
    </div>
  );
}