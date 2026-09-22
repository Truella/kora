/**
 * Central E.164 phone normalizer — the ONLY place phone numbers are shaped
 * before writing to `profiles.phone`.
 *
 * Why: the USSD webhook looks up profiles by exact string match on
 * `profiles.phone`, and the DB enforces `profiles_phone_e164`
 * (`^\+[1-9][0-9]{6,14}$`, NULL allowed). Any formatting inconsistency
 * breaks that lookup, so every capture site (signup, add-phone flow) must
 * pass through `normalizeToE164` first.
 */

export const COUNTRY_CODES = {
  NG: "234",
  KE: "254",
  UG: "256",
  GH: "233",
} as const;

export type CountryKey = keyof typeof COUNTRY_CODES;

const E164 = /^\+[1-9][0-9]{6,14}$/;

export class InvalidPhoneError extends Error {
  constructor(raw: string) {
    super(`Cannot normalize "${raw}" to E.164`);
    this.name = "InvalidPhoneError";
  }
}

/**
 * Normalize a user-entered phone number to E.164.
 *
 * Accepts: "+2348012345678", "08012345678" (local, needs defaultCountry),
 * "2348012345678" (country code without +), and the same with
 * spaces/dashes/parentheses. Throws InvalidPhoneError otherwise.
 */
export function normalizeToE164(raw: string, defaultCountry: CountryKey): string {
  const digits = raw.replace(/[^\d+]/g, "");
  const cc = COUNTRY_CODES[defaultCountry];

  let e164: string;
  if (digits.startsWith("+")) {
    e164 = digits;
  } else if (digits.startsWith(cc)) {
    e164 = `+${digits}`;
  } else if (digits.startsWith("0")) {
    e164 = `+${cc}${digits.slice(1)}`;
  } else {
    e164 = `+${cc}${digits}`;
  }

  if (!E164.test(e164)) throw new InvalidPhoneError(raw);
  return e164;
}
