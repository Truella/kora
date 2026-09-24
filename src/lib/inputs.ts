// Live input shaping — the ONLY place typed text is constrained before
// validation. Validation still owns rejection (normalizeToE164, submit
// regexes); these helpers just stop impossible characters and runaway
// length at the keystroke, so the error paths below them fire less often.

export const MAX_PHONE_DIGITS = 15; // E.164 ceiling
export const MAX_PHONE_LEN = MAX_PHONE_DIGITS + 1; // + leading "+"

// Phone: optional single leading "+", digits only, capped at E.164 length.
// Spaces/dashes/parens never survive a keystroke — pastes like
// "+234 801 234 5678" collapse to "+2348012345678", which normalizeToE164
// already accepts.
export function sanitizePhoneInput(raw: string): string {
  const plus = raw.trimStart().startsWith("+") ? "+" : "";
  const digits = raw.replace(/\D/g, "").slice(0, MAX_PHONE_DIGITS);
  return `${plus}${digits}`;
}

// Amount: digits plus one dot, max 2 decimals, max 10 integer digits
// (numeric(12,2) headroom). Always returns a typeable string — a second dot
// or a letter is dropped, never the whole edit. Partial states ("5.", "")
// survive so typing never fights the field; submit validation still owns
// the final shape.
export function sanitizeAmountInput(raw: string): string {
  const filtered = raw.replace(/,/g, "").replace(/[^0-9.]/g, "");
  const [head, ...rest] = filtered.split(".");
  const int = head.slice(0, 10);
  if (rest.length === 0) return int;
  return `${int}.${rest.join("").slice(0, 2)}`;
}

// Display grouping for a valid amount ("5000" → "5,000"). Applied on blur
// only — grouping while typing drags the caret. Partial states ("5.", "")
// pass through untouched; the submit regex still rejects them.
export function formatAmountDisplay(raw: string): string {
  const clean = raw.replace(/,/g, "");
  const normalized = clean.endsWith(".") ? clean.slice(0, -1) : clean;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return raw;
  const [int, dec] = normalized.split(".");
  const grouped = Number(int).toLocaleString("en-US");
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}

// Numeric value of a possibly-grouped amount. Empty → 0 (callers validate
// positivity separately).
export function parseAmount(raw: string): number {
  const clean = raw.replace(/,/g, "");
  return clean === "" ? 0 : Number(clean);
}
