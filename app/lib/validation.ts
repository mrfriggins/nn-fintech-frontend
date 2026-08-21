export const MIN_AMOUNT = 0.01;
export const MAX_AMOUNT = 1_000_000;

/** Returns a normalized 2-decimal amount string, or null when the input is not a usable amount. */
export function parseAmount(
  value: string | number,
  { min = MIN_AMOUNT, max = MAX_AMOUNT }: { min?: number; max?: number } = {},
): string | null {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value).trim());
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed.toFixed(2);
}

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Accepts only absolute http(s) URLs, blocking javascript:/data: and other schemes. */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
