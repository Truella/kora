// Supported-country options shared by the auth forms. Dial codes and
// currencies stay in lib/phone (COUNTRY_CODES / COUNTRY_TO_CURRENCY) —
// this is only the {key, name} list so the three copies in the forms
// become one.
import type { CountryKey } from "@/lib/phone";

export const COUNTRY_OPTIONS: { key: CountryKey; name: string }[] = [
  { key: "NG", name: "Nigeria" },
  { key: "KE", name: "Kenya" },
  { key: "UG", name: "Uganda" },
  { key: "GH", name: "Ghana" },
];

export const ONBOARDING_STEPS = ["Your name", "Home country", "Review"];
