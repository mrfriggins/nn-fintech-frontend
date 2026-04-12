"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * THE ENTRY PROTOCOL
 * This page redirects all traffic to the Dashboard.
 * It ensures users land on the unified authentication gate.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Immediate redirection to the master dashboard logic
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono">
      <div className="text-[#00ff41] text-xs font-black uppercase tracking-[0.2em] animate-pulse">
        Initializing NN-Fintech Gateway...
      </div>
    </div>
  );
}