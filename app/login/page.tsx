"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        setTimeout(() => {
          router.push(data.role === "admin" ? "/dashboard/admin" : "/dashboard");
        }, 150);
      } else alert(data.error);
    } catch { alert("Connection to HQ Failed"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <form onSubmit={handleLogin} className="bg-white border-4 border-black p-10 w-full max-w-md shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] space-y-6">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">NN-FINTECH ACCESS</h1>
        <input type="email" placeholder="ADMIN/USER EMAIL" required className="w-full p-4 border-2 border-black outline-none font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="SECURITY KEY" required className="w-full p-4 border-2 border-black outline-none font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="w-full bg-black text-white p-5 font-black uppercase text-xl hover:bg-green-500 hover:text-black transition-all">
          Authorize Login
        </button>
      </form>
    </div>
  );
}