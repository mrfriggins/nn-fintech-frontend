"use client";

export default function Ticker({ stocks }: { stocks: any[] }) {
  return (
    <div className="w-full bg-[#050505] border-b-2 border-[#00ff41] overflow-hidden h-12 flex items-center shadow-[0_5px_15px_rgba(0,255,65,0.2)] z-50">
      <div className="flex whitespace-nowrap animate-ticker">
        {[...stocks, ...stocks].map((s, i) => (
          <div key={i} className="flex items-center px-10 border-r border-zinc-800 h-full">
            <span className="text-[#00ff41] font-black text-[10px] tracking-widest mr-3">
              {s.symbol}
            </span>
            <span className="text-white font-mono font-bold text-sm mr-4">
              ${s.price.toFixed(2)}
            </span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm ${
              s.change.includes('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {s.change}
            </span>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: flex;
          animation: ticker 30s linear infinite;
        }
      `}</style>
    </div>
  );
}