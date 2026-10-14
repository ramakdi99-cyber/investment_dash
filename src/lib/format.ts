/**
 * Formatting helpers.
 *
 * CURRENCY CHOICE: the product is distributed over WhatsApp and targets
 * India-first advisory teams, so all money is rendered in Indian Rupees with
 * `en-IN` grouping. Swap `CURRENCY` below to change the entire product.
 */

export const CURRENCY = "INR";
export const LOCALE = "en-IN";

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

const compactNumberFormatter = new Intl.NumberFormat(LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** `₹1,25,000` */
export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return currencyFormatter.format(value);
}

/** `₹1.3L` — used in dense surfaces where space is tight. */
export function formatCurrencyCompact(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return compactCurrencyFormatter.format(value);
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return numberFormatter.format(value);
}

export function formatNumberCompact(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return compactNumberFormatter.format(value);
}

/** Renders an em dash for every kind of missing data in the UI. */
export const NOT_PROVIDED = "Not provided";

export function orNotProvided<T>(value: T | null | undefined, render: (value: T) => string) {
  if (value === null || value === undefined || value === "") return NOT_PROVIDED;
  return render(value);
}

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return NOT_PROVIDED;
  return dateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return NOT_PROVIDED;
  return dateTimeFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function formatTime(value: string | Date) {
  return timeFormatter.format(typeof value === "string" ? new Date(value) : value);
}

/** "Today", "Yesterday", "3 days ago", "in 2h", then an absolute date. */
export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return NOT_PROVIDED;
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - date.getTime();
  const day = 86_400_000;

  // Future dates appear on scheduled follow-ups ("due in 2h").
  if (diffMs < 0) {
    const future = -diffMs;
    if (future < 3_600_000) return `in ${Math.max(1, Math.floor(future / 60_000))}m`;
    if (isSameDay(date, new Date())) return `today, ${timeFormatter.format(date)}`;
    if (future < 24 * 3_600_000) return `in ${Math.floor(future / 3_600_000)}h`;
    if (future < 7 * day) return `in ${Math.floor(future / day)}d`;
    return dateFormatter.format(date);
  }

  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (isSameDay(date, new Date())) return `Today, ${timeFormatter.format(date)}`;
  if (diffMs < 2 * day) return "Yesterday";
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} days ago`;
  return dateFormatter.format(date);
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** `YYYY-MM-DD` in local time — the wire format used by URL filters. */
export function toDateInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Truncates long strings for table cells; the full value stays in a tooltip. */
export function truncate(value: string, max = 64) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
