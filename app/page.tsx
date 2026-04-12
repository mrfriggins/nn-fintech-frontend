"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    // AUTH CHECK: Send logged-in users to v3.0, others to Auth
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/auth");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono">
      <div className="text-white animate-pulse uppercase font-black tracking-widest text-xs">
        Establishing Secure Handshake...
      </div>
    </div>
  );
}