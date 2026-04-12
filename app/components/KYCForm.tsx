"use client";
import { useState } from "react";

export default function KYCForm({ kycStatus, onStatusUpdate }: any) {
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    phoneNumber: "",
    documentUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://127.0.0.1:8080/api/kyc/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage("✅ Identity Submitted. Awaiting Admin Review.");
        onStatusUpdate("SUBMITTED");
      } else {
        setMessage("❌ Submission Failed. Check all fields.");
      }
    } catch (err) {
      setMessage("❌ Vault Connection Error.");
    } finally {
      setLoading(false);
    }
  };

  // If already verified, don't show the form
  if (kycStatus === "VERIFIED") return null;
  if (kycStatus === "SUBMITTED") {
    return (
      <div className="bg-zinc-900 text-yellow-400 p-6 border-4 border-black font-black uppercase italic animate-pulse">
        Status: Verification in Progress. Withdrawals Restricted.
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
      <h2 className="text-3xl font-black uppercase italic mb-6 border-b-4 border-black pb-2">
        Identity Verification (KYC)
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            required
            type="text"
            placeholder="Full Legal Name"
            className="p-3 border-2 border-black outline-none focus:bg-zinc-100 font-bold"
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
          <input
            required
            type="text"
            placeholder="NIDA / ID Number"
            className="p-3 border-2 border-black outline-none focus:bg-zinc-100 font-bold"
            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
          />
          <input
            required
            type="text"
            placeholder="Phone Number (+255...)"
            className="p-3 border-2 border-black outline-none focus:bg-zinc-100 font-bold"
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          />
          <input
            required
            type="text"
            placeholder="ID Image URL (Cloud Link)"
            className="p-3 border-2 border-black outline-none focus:bg-zinc-100 font-bold"
            onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-black text-white font-black py-4 uppercase hover:bg-zinc-800 transition-all border-b-4 border-zinc-600 active:border-b-0"
        >
          {loading ? "Encrypting Identity..." : "Certify My Identity"}
        </button>
      </form>
      {message && <p className="mt-4 text-center font-black uppercase text-xs tracking-tighter">{message}</p>}
    </div>
  );
}