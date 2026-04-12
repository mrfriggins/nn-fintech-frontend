"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function AuthGateway() {
  const router = useRouter();
  
  // State Machine: 'login' | 'register' | 'verify'
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("${API_URL}/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMode("verify"); // Instantly flip the UI to the OTP screen
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Network failure. Mainframe unreachable.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("${API_URL}/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem("token", data.token);
        router.push("/dashboard"); // Vault Unlocked, enter the empire
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("${API_URL}/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else if (res.status === 403 && data.error.includes("verify")) {
        // EDGE CASE: They registered but closed the tab before verifying. 
        // When they try to log in, the server kicks them back. We catch that and show the OTP screen.
        setMode("verify"); 
        setError("Account locked. Please enter the code sent to your email.");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-mono text-black">
      <div className="max-w-md w-full bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] p-8">
        
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
          {mode === "verify" ? "Security Audit" : mode === "login" ? "Vault Access" : "Create Node"}
        </h1>
        <p className="font-bold text-zinc-500 text-sm mb-6 uppercase">
          {mode === "verify" ? "Enter the 6-digit transmission" : "NN-Fintech Enterprise Network"}
        </p>

        {error && (
          <div className="bg-red-100 border-2 border-red-600 text-red-600 p-3 mb-6 text-xs font-black uppercase">
            {error}
          </div>
        )}

        <form onSubmit={mode === "login" ? handleLogin : mode === "register" ? handleRegister : handleVerify} className="space-y-4">
          
          {/* Email & Password are hidden during the OTP step to keep the UI clean */}
          {mode !== "verify" && (
            <>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Corporate Email</label>
                <input 
                  type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border-2 border-black outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Passphrase</label>
                <input 
                  type="password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border-2 border-black outline-none font-bold"
                />
              </div>
            </>
          )}

          {/* OTP Input only shows during the verification step */}
          {mode === "verify" && (
            <div>
              <label className="block text-xs font-black uppercase mb-1 text-purple-600">6-Digit Authorization Code</label>
              <input 
                type="text" required maxLength={6}
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Forces numbers only
                placeholder="000000"
                className="w-full p-4 border-4 border-black outline-none font-black text-center text-3xl tracking-[1em]"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white py-4 font-black uppercase hover:bg-yellow-400 hover:text-black transition-all disabled:bg-zinc-400 mt-4"
          >
            {loading ? "Processing..." : mode === "verify" ? "Verify & Enter" : mode === "login" ? "Execute Login" : "Initialize Account"}
          </button>
        </form>

        {/* UI Toggle Links */}
        {mode !== "verify" && (
          <div className="mt-6 pt-6 border-t-2 border-zinc-200 text-center">
            <button 
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-xs font-black text-zinc-500 uppercase hover:text-black underline decoration-2 underline-offset-4"
            >
              {mode === "login" ? "Request new access credentials" : "I already hold a vault key"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}