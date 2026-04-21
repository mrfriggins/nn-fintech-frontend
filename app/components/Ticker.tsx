import React from "react";

export default function Ticker({ stocks }: { stocks: any[] }) {
  if (!stocks || stocks.length === 0) return null;

  return (
    <div className="w-full bg-black border-b border-zinc-800 py-3 overflow-hidden flex items-center whitespace-nowrap">
      <div className="flex gap-10 px-4 overflow-x-auto">
        {stocks.map((s, i) => (
          <div key={i} className="flex gap-4 items-center">
            <span className="text-[10px] font-black text-zinc-400 uppercase">{s.symbol}</span>
            <span className="text-[10px] font-mono font-black text-[#00ff41]">${s.price?.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}