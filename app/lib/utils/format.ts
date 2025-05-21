export function formatCurrency(
  amount: number | null | undefined,
  locale = "vi-VN",
  currency = "VND"
): string {
  if (amount === null || amount === undefined) return "";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date string to a readable format
 * @param dateString - The date string to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
): string {
  if (!dateString || dateString === "0001-01-01T00:00:00") return "TBA";

  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export function formatDuration(weeks: any): string {
  const WEEKS_PER_MONTH = 4.345;

  if (weeks < 4) {
    return `${weeks} weeks`;
  }

  const months = weeks / WEEKS_PER_MONTH;
  const wholeMonths = Math.floor(months);
  const remainingWeeks = Math.round((months - wholeMonths) * WEEKS_PER_MONTH);

  if (remainingWeeks === 0) {
    return wholeMonths === 1 ? `${wholeMonths} month` : `${wholeMonths} months`;
  } else {
    return `${wholeMonths} ${
      wholeMonths === 1 ? "month" : "months"
    } and ${remainingWeeks} ${remainingWeeks === 1 ? "week" : "weeks"}`;
  }
}
