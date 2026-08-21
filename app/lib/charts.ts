import {
  CandlestickSeries,
  ColorType,
  createChart,
  IChartApi,
  ISeriesApi,
  Time,
} from "lightweight-charts";

export type Candle = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type HistoryOptions = {
  basePrice: number;
  initialPrice?: number;
  count: number;
  barInterval: number;
  openVolatility: number;
  closeVolatility: number;
  highVolatility: number;
  lowVolatility: number;
  volatilityReference?: "base" | "current";
};

export const generateSimulatedHistory = ({
  basePrice,
  initialPrice = basePrice,
  count,
  barInterval,
  openVolatility,
  closeVolatility,
  highVolatility,
  lowVolatility,
  volatilityReference = "base",
}: HistoryOptions): Candle[] => {
  const history: Candle[] = [];
  const time = Math.floor(Date.now() / 1000) - (count * barInterval);
  let lastClose = initialPrice;

  for (let i = 0; i < count; i++) {
    const volatilityBase = volatilityReference === "current" ? lastClose : basePrice;
    const open = lastClose + (Math.random() - 0.5) * (volatilityBase * openVolatility);
    const close = open + (Math.random() - 0.5) * (volatilityBase * closeVolatility);
    const high = Math.max(open, close) + Math.random() * (volatilityBase * highVolatility);
    const low = Math.min(open, close) - Math.random() * (volatilityBase * lowVolatility);
    history.push({ time: (time + (i * barInterval)) as Time, open, high, low, close });
    lastClose = close;
  }

  return history;
};

export const morphLiveCandle = (
  candle: Candle,
  currentPrice: number,
  updateTime = false,
): Candle => ({
  time: updateTime ? Math.floor(Date.now() / 1000) as Time : candle.time,
  open: candle.open,
  high: Math.max(candle.high, currentPrice),
  low: Math.min(candle.low, currentPrice),
  close: currentPrice,
});

export type CandlestickChartOptions = {
  height: number;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  borderColor?: string;
  crosshairMode?: number;
  timeVisible: boolean;
  secondsVisible: boolean;
  upColor: string;
  downColor: string;
  wickUpColor: string;
  wickDownColor: string;
};

export const createCandlestickChart = (
  container: HTMLDivElement,
  options: CandlestickChartOptions,
): {
  chart: IChartApi;
  series: ISeriesApi<"Candlestick">;
} => {
  const chart = createChart(container, {
    layout: {
      background: { type: ColorType.Solid, color: options.backgroundColor },
      textColor: options.textColor,
    },
    grid: {
      vertLines: { color: options.gridColor },
      horzLines: { color: options.gridColor },
    },
    width: container.clientWidth,
    height: options.height,
    ...(options.crosshairMode === undefined ? {} : { crosshair: { mode: options.crosshairMode } }),
    timeScale: {
      timeVisible: options.timeVisible,
      secondsVisible: options.secondsVisible,
      ...(options.borderColor === undefined ? {} : { borderColor: options.borderColor }),
    },
    ...(options.borderColor === undefined
      ? {}
      : { rightPriceScale: { borderColor: options.borderColor } }),
  });
  const series = chart.addSeries(CandlestickSeries, {
    upColor: options.upColor,
    downColor: options.downColor,
    borderVisible: false,
    wickUpColor: options.wickUpColor,
    wickDownColor: options.wickDownColor,
  });

  return { chart, series };
};

export const attachChartResizeListener = (
  chart: IChartApi,
  container: HTMLDivElement,
): (() => void) => {
  const handleResize = () => chart.applyOptions({ width: container.clientWidth });
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
};

export const getChartScale = (
  values: number[],
  padding = 0.0005,
): { min: number; max: number; range: number } => {
  const max = Math.max(...values) * (1 + padding);
  const min = Math.min(...values) * (1 - padding);
  return { min, max, range: max - min === 0 ? 1 : max - min };
};
