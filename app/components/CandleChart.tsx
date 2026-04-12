"use client";
import { useEffect, useRef } from "react";
// V5 UPDATE: CandlestickSeries must be imported explicitly now
import { createChart, ColorType, CandlestickSeries, Time } from "lightweight-charts";

export default function CandleChart({ symbol, currentPrice }: { symbol: string, currentPrice: number }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<any>(null);
  const lastCandleRef = useRef<any>(null); // Memory cache for the live tick engine

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Initialize Chart with Terminal Theme
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#050505' }, textColor: '#4a4a4a' },
      grid: { vertLines: { color: '#111' }, horzLines: { color: '#111' } },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#111' },
      rightPriceScale: { borderColor: '#111' },
    });

    // 2. V5 COMPATIBLE SERIES INJECTION
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff41', downColor: '#ff0000', borderVisible: false,
      wickUpColor: '#00ff41', wickDownColor: '#ff0000',
    });
    seriesRef.current = candleSeries;

    // 3. Generate Simulated Institutional History
    const history = [];
    let time = Math.floor(Date.now() / 1000) - (100 * 60); // 100 minutes ago
    let lastClose = currentPrice * 0.95; // Start 5% lower

    for (let i = 0; i < 100; i++) {
      const open = lastClose + (Math.random() - 0.5) * (currentPrice * 0.005);
      const close = open + (Math.random() - 0.5) * (currentPrice * 0.01);
      const high = Math.max(open, close) + Math.random() * (currentPrice * 0.005);
      const low = Math.min(open, close) - Math.random() * (currentPrice * 0.005);
      history.push({ time: time as Time, open, high, low, close });
      lastClose = close;
      time += 60; // 1 minute candles
    }
    
    candleSeries.setData(history);
    lastCandleRef.current = history[history.length - 1]; // Store the tip of the spear

    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    window.addEventListener('resize', handleResize);

    return () => { 
      window.removeEventListener('resize', handleResize); 
      chart.remove(); 
    };
  }, [symbol]); // Re-draw entirely when asset changes

  // 4. Live Price Update Engine
  useEffect(() => {
    if (!seriesRef.current || !lastCandleRef.current) return;
    
    const last = lastCandleRef.current;
    
    // Morph the live candle based on the incoming websocket/simulated tick
    const updatedCandle = {
        time: last.time,
        open: last.open,
        high: Math.max(last.high, currentPrice),
        low: Math.min(last.low, currentPrice),
        close: currentPrice,
    };
    
    seriesRef.current.update(updatedCandle);
    lastCandleRef.current = updatedCandle; // Save state for next tick

  }, [currentPrice]);

  return <div ref={chartContainerRef} className="w-full h-[300px] border border-zinc-800" />;
}