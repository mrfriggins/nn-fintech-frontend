type NumberFormatOptions = {
  absolute?: boolean;
  grouping?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export const formatUsdAmount = (
  amount: number,
  options: NumberFormatOptions = {},
): string => {
  const value = options.absolute ? Math.abs(amount) : amount;
  if (options.grouping === false) {
    const digits = options.minimumFractionDigits ?? options.maximumFractionDigits ?? 2;
    return value.toFixed(digits);
  }

  return value.toLocaleString(undefined, {
    ...(options.minimumFractionDigits === undefined
      ? {}
      : { minimumFractionDigits: options.minimumFractionDigits }),
    ...(options.maximumFractionDigits === undefined
      ? {}
      : { maximumFractionDigits: options.maximumFractionDigits }),
  });
};

export const formatSignedAmount = (
  amount: number,
  options: NumberFormatOptions = {},
): string => {
  const sign = amount >= 0 ? "+" : "-";
  return `${sign}${formatUsdAmount(amount, { ...options, absolute: true })}`;
};

export const signColorClass = (
  amount: number,
  positiveClass: string,
  negativeClass: string,
  zeroIsPositive = false,
): string => (
  amount > 0 || (zeroIsPositive && amount === 0) ? positiveClass : negativeClass
);

export const changeColorClass = (
  change: string,
  positiveClass: string,
  negativeClass: string,
  negativeWhenContains = false,
): string => (
  negativeWhenContains
    ? (change.includes("-") ? negativeClass : positiveClass)
    : (change.startsWith("+") ? positiveClass : negativeClass)
);

export const formatTimestamp = (timestamp: string | number | Date): string =>
  new Date(timestamp).toLocaleString();
