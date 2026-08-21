import { DependencyList, useEffect, useRef } from "react";

export const usePolling = (
  callback: () => void | Promise<void>,
  intervalMs: number,
  deps: DependencyList,
  enabled = true,
) => {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    callbackRef.current();
    const interval = setInterval(() => callbackRef.current(), intervalMs);
    return () => clearInterval(interval);
  }, [enabled, intervalMs, ...deps]);
};
