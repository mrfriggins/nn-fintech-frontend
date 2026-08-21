"use client";

import { useState, useEffect } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { ApiRecord, apiFetch, errorMessage, logError, toText } from "../../lib/api";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("10.00");
  const [error, setError] = useState("");

  const updateBalance = async () => {
    try {
      const data = await apiFetch<ApiRecord>("/api/account/balance");
      setBalance(Number(data?.balance) || 0);
      setError("");
    } catch (err) {
      logError("balance fetch failed", err);
      setError(errorMessage(err, "Could not read the vault balance."));
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
        {error && (
          <p className="mt-4 bg-red-100 border-4 border-red-600 text-red-700 p-3 font-black uppercase text-xs">
            {error}
          </p>
        )}
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
              try {
                const order = await apiFetch<ApiRecord>("/api/paypal/create-order", {
                  method: "POST",
                  body: JSON.stringify({ amount })
                });
                const orderId = toText(order?.id);
                if (!orderId) throw new Error("Gateway returned no order id.");
                setError("");
                return orderId;
              } catch (err) {
                logError("paypal order creation failed", err);
                setError(errorMessage(err, "Could not open the payment gateway."));
                // Rethrow so the PayPal SDK aborts the flow instead of
                // proceeding with an undefined order id.
                throw err;
              }
            }}
            onApprove={async (data) => {
              try {
                await apiFetch("/api/paypal/capture-order", {
                  method: "POST",
                  body: JSON.stringify({ orderID: data.orderID })
                });
                setError("");
                alert("CAPITAL SECURED.");
                await updateBalance();
              } catch (err) {
                logError("paypal capture failed", err);
                // A failed capture on an approved payment must never look
                // like a no-op: the operator has to know money may be held.
                setError(
                  `${errorMessage(err, "Capture failed.")} Payment was approved but not captured — contact support with order ${data.orderID}.`
                );
              }
            }}
            onError={(err) => {
              logError("paypal sdk error", err);
              setError("Payment gateway error. No funds were moved.");
            }}
          />
        </PayPalScriptProvider>
      </div>
    </div>
  );
}