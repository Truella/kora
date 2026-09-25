// Money + date formatting shared by every surface that prints a figure.
//
// Two rules this file exists to enforce:
//
// 1. Determinism. Everything is pinned rather than left to the host locale —
//    `toLocaleString()` with no argument renders differently depending on where
//    the code runs, and these strings are pre-formatted server-side then
//    compared against a client render.
// 2. No phantom timezones. `cycles.due_date` is a Postgres `date` (no time, no
//    zone). `new Date("2026-09-27")` parses it as UTC midnight, so any server
//    behind UTC renders the 26th. Date-only values are therefore read as plain
//    calendar fields and never round-tripped through an instant.

export const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  GHS: "GH₵",
  KES: "KSh",
  UGX: "USh",
};

export function currencySymbol(currency: string): string {
  return SYMBOLS[currency] ?? currency;
}

// Pinned to a locale with guaranteed comma grouping rather than the host's, so
// the server render and any client refetch of /api/home agree.
const GROUPED = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatMoney(amount: number | string, currency: string): string {
  return `${currencySymbol(currency)}${GROUPED.format(Number(amount))}`;
}

export function formatAmount(amount: number | string): string {
  return GROUPED.format(Number(amount));
}

// Fixed UTC offsets in minutes. Nigeria, Ghana, Kenya and Uganda all sit on a
// single offset with no daylight saving, so a table is exact here and keeps the
// greeting deterministic on the server (no hydration drift, no guessing).
export const COUNTRY_UTC_OFFSET: Record<string, number> = {
  NG: 60,
  GH: 0,
  KE: 180,
  UG: 180,
};

const DEFAULT_OFFSET = 60;

export function offsetForCountry(country: string | null | undefined): number {
  if (!country) return DEFAULT_OFFSET;
  return COUNTRY_UTC_OFFSET[country.toUpperCase()] ?? DEFAULT_OFFSET;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Calendar fields of a Postgres `date`, read straight off the string. */
export type CalendarDate = { y: number; m: number; d: number };

export function parseDateOnly(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

export function toDateOnly(calendar: CalendarDate): string {
  const mm = String(calendar.m).padStart(2, "0");
  const dd = String(calendar.d).padStart(2, "0");
  return `${calendar.y}-${mm}-${dd}`;
}

/**
 * The UTC calendar date of a timestamptz, for comparing against a `date`
 * column.
 *
 * Deliberately UTC rather than the member's own country offset: the
 * process-payout Edge Function decides this same boundary from the stored
 * timestamptz with no way to read each member's auth metadata, and if the app
 * and the function disagreed by even one day a member could be counted as
 * "expected" for a cycle the app says they do not owe — which is a
 * disbursement gate that would 409 forever. One definition, one answer. The
 * cost is at most a one-day imprecision for a member joining within hours of
 * a cycle boundary.
 */
export function utcDateOnly(timestamptz: string): string {
  return timestamptz.slice(0, 10);
}

/** "Fri, 27 Sep" — from a `date` column, so there is no timezone to get wrong. */
export function formatCycleDate(value: string): string {
  const c = parseDateOnly(value);
  if (!c) return "—";
  // Anchored in UTC purely to reach the weekday; the fields are already
  // calendar values, so this cannot shift them.
  const weekday = new Date(Date.UTC(c.y, c.m - 1, c.d)).getUTCDay();
  return `${WEEKDAYS[weekday]}, ${c.d} ${MONTHS[c.m - 1].slice(0, 3)}`;
}

/** "27 Sep" — short form of the same calendar fields. */
export function formatCycleDateShort(value: string): string {
  const c = parseDateOnly(value);
  if (!c) return "—";
  return `${c.d} ${MONTHS[c.m - 1].slice(0, 3)}`;
}

export function monthName(calendar: CalendarDate): string {
  return MONTHS[calendar.m - 1];
}

/**
 * Calendar fields of an instant (a timestamptz) as seen in the member's own
 * country. Shifting by hand rather than via Intl timeZone keeps this exact and
 * dependency-free — and these countries have no DST, so a fixed offset is the
 * whole truth.
 */
export function localParts(
  instant: string | number | Date,
  offsetMinutes: number,
): CalendarDate & { h: number } {
  const ms = new Date(instant).getTime() + offsetMinutes * 60_000;
  const shifted = new Date(ms);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
    h: shifted.getUTCHours(),
  };
}

export function todayIn(offsetMinutes: number): CalendarDate {
  return localParts(Date.now(), offsetMinutes);
}

export function greetingFor(offsetMinutes: number): "morning" | "afternoon" | "evening" {
  const { h } = localParts(Date.now(), offsetMinutes);
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/** Whole days from today to a `date` column. Negative means overdue. */
export function daysUntil(value: string, today: CalendarDate): number {
  const c = parseDateOnly(value);
  if (!c) return Number.POSITIVE_INFINITY;
  const target = Date.UTC(c.y, c.m - 1, c.d);
  const base = Date.UTC(today.y, today.m - 1, today.d);
  return Math.round((target - base) / 86_400_000);
}

/** "Tomorrow" / "Next week" / "Next month" for a future `date` column —
 * used where the card answers "when is mine", not the exact calendar day. */
export function relativeDayLabel(value: string, today: CalendarDate): string {
  const diff = daysUntil(value, today);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return "Next week";
  if (diff <= 14) return "In 2 weeks";
  if (diff <= 21) return "In 3 weeks";
  if (diff <= 28) return "In 4 weeks";
  if (diff <= 62) return "Next month";
  return formatCycleDateShort(value);
}

/** "Today" / "Yesterday" / "20 Sep" for a settled event. */
export function settledDayLabel(
  instant: string | null,
  offsetMinutes: number,
  today: CalendarDate,
): string {
  if (!instant) return "—";
  const then = localParts(instant, offsetMinutes);
  if (then.y === today.y && then.m === today.m && then.d === today.d) return "Today";
  const yesterday = new Date(
    Date.UTC(today.y, today.m - 1, today.d) - 86_400_000,
  );
  if (
    then.y === yesterday.getUTCFullYear() &&
    then.m === yesterday.getUTCMonth() + 1 &&
    then.d === yesterday.getUTCDate()
  ) {
    return "Yesterday";
  }
  return `${then.d} ${MONTHS[then.m - 1].slice(0, 3)}`;
}
