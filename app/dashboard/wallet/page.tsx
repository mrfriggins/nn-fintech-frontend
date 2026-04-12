"use client";

import { useState, useEffect } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("10.00");

  const updateBalance = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:8080/api/account/balance", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    setBalance(data.balance || 0);
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

        <PayPalScriptProvider options={{ 
            clientId: "ASSLKTkkkGZUWVOgHp9zrtdqCZTr_Mw2KURxit5dnCmKOJZhoJlnGoIfykIWicat1hAz91d4lTj5jp5D", 
            currency: "USD",
            intent: "capture"
        }}>
          <PayPalButtons 
            forceReRender={[amount]}
            style={{ layout: "vertical", color: "black", shape: "rect" }}
            createOrder={async () => {
              const res = await fetch("http://127.0.0.1:8080/api/paypal/create-order", {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ amount })
              });
              const order = await res.json();
              return order.id;
            }}
            onApprove={async (data) => {
              const res = await fetch("http://127.0.0.1:8080/api/paypal/capture-order", {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ orderID: data.orderID })
              });
              if (res.ok) {
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