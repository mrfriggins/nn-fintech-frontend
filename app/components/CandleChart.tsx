"use client";
import { useEffect, useRef } from "react";
import {
  attachChartResizeListener,
  createCandlestickChart,
  generateSimulatedHistory,
  morphLiveCandle,
} from "@/app/lib/charts";

export default function CandleChart({ symbol, currentPrice }: { symbol: string, currentPrice: number }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<any>(null);
  const lastCandleRef = useRef<any>(null); // Memory cache for the live tick engine

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const { chart, series: candleSeries } = createCandlestickChart(chartContainerRef.current, {
      height: 300,
      backgroundColor: "#050505",
      textColor: "#4a4a4a",
      gridColor: "#111",
      borderColor: "#111",
      timeVisible: true,
      secondsVisible: false,
      upColor: "#00ff41",
      downColor: "#ff0000",
      wickUpColor: "#00ff41",
      wickDownColor: "#ff0000",
    });
    seriesRef.current = candleSeries;

    const history = generateSimulatedHistory({
      basePrice: currentPrice,
      initialPrice: currentPrice * 0.95,
      count: 100,
      barInterval: 60,
      openVolatility: 0.005,
      closeVolatility: 0.01,
      highVolatility: 0.005,
      lowVolatility: 0.005,
    });
    candleSeries.setData(history);
    lastCandleRef.current = history[history.length - 1];
    const removeResizeListener = attachChartResizeListener(chart, chartContainerRef.current);

    return () => {
      removeResizeListener();
      chart.remove();
    };
  }, [symbol]);

  // 4. Live Price Update Engine
  useEffect(() => {
    if (!seriesRef.current || !lastCandleRef.current) return;
    
    const last = lastCandleRef.current;
    
    const updatedCandle = morphLiveCandle(last, currentPrice);
    
    seriesRef.current.update(updatedCandle);
    lastCandleRef.current = updatedCandle; // Save state for next tick

  }, [currentPrice]);

  return <div ref={chartContainerRef} className="w-full h-[300px] border border-zinc-800" />;
}