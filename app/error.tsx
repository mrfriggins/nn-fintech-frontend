"use client";

import { useEffect } from "react";
import { logError } from "./lib/api";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logError("render error boundary", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center p-6">
      <div className="border border-red-900 bg-red-950/10 p-8 max-w-lg w-full space-y-4">
        <h1 className="text-sm font-bold tracking-widest text-red-500">
          [ TERMINAL FAULT ]
        </h1>
        <p className="text-xs text-gray-400 leading-relaxed break-words">
          {error.message || "The interface crashed while rendering."}
        </p>
        {error.digest && (
          <p className="text-[10px] text-gray-600 tracking-widest">
            TRACE: {error.digest}
          </p>
        )}
        <button
          onClick={() => unstable_retry()}
          className="border border-green-700 text-green-400 hover:bg-green-500 hover:text-black transition-colors px-4 py-2 text-xs font-bold tracking-widest"
        >
          RETRY
        </button>
      </div>
    </div>
  );
}
