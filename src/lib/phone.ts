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

export const COUNTRY_NAMES: Record<CountryKey, string> = {
  NG: "Nigeria",
  KE: "Kenya",
  UG: "Uganda",
  GH: "Ghana",
};

const COUNTRY_DEMONYMS: Record<CountryKey, string> = {
  NG: "Nigerian",
  KE: "Kenyan",
  UG: "Ugandan",
  GH: "Ghanaian",
};

const E164 = /^\+[1-9][0-9]{6,14}$/;

export class InvalidPhoneError extends Error {
  constructor(raw: string) {
    super(`Cannot normalize "${raw}" to E.164`);
    this.name = "InvalidPhoneError";
  }
}

// Thrown when the number carries an explicit country code that doesn't
// match the selected country — e.g. +254… with Nigeria selected. The UI
// turns this into "switch the country selector" guidance.
export class MismatchedCountryError extends Error {
  detected: CountryKey;
  constructor(raw: string, detected: CountryKey) {
    super(`"${raw}" looks like a ${COUNTRY_DEMONYMS[detected]} number`);
    this.name = "MismatchedCountryError";
    this.detected = detected;
  }
}

function detectExplicitCountry(digits: string): CountryKey | null {
  const bare = digits.startsWith("+") ? digits.slice(1) : digits;
  // The four codes share no prefix relations (234/233, 254/256 all
  // differ before either is a prefix of the other), so first match wins.
  for (const key of Object.keys(COUNTRY_CODES) as CountryKey[]) {
    if (bare.startsWith(COUNTRY_CODES[key])) return key;
  }
  return null;
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
    const explicit = detectExplicitCountry(digits);
    if (explicit && explicit !== defaultCountry) {
      throw new MismatchedCountryError(raw, explicit);
    }
    e164 = digits;
  } else if (digits.startsWith(cc)) {
    e164 = `+${digits}`;
  } else if (digits.startsWith("0")) {
    e164 = `+${cc}${digits.slice(1)}`;
  } else {
    // Bare digits carrying a foreign code (e.g. 254… with Nigeria
    // selected and too long to be a local number) — same guidance.
    const explicit = detectExplicitCountry(digits);
    if (explicit && digits.length >= 11) {
      throw new MismatchedCountryError(raw, explicit);
    }
    e164 = `+${cc}${digits}`;
  }

  if (!E164.test(e164)) throw new InvalidPhoneError(raw);
  return e164;
}
