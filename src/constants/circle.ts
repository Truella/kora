// Circle workspace shared styling constants. Extracted from TurnViews so
// the split turn components share one source.
import type { CountryKey } from "@/lib/phone";
import type { Currency } from "@/types/circle";

// Anchors the /home attention queue deep-links to. Duplicated from the
// detail page so this module stays self-contained.
export const ANCHOR_MT = "scroll-mt-[calc(var(--app-header-h)+1rem)]";

export const DARK_HERO =
  "bg-[radial-gradient(circle_at_88%_8%,rgba(191,154,78,0.26),transparent_34%),linear-gradient(135deg,#0B2624_0%,#14524F_125%)]";

// Directory status styling (string maps for the /groups list rows). The
// home CircleCard carries a richer badge object that lives with the card.
// Same explicit states everywhere: paused is danger-tinted (halted), never
// the forming amber — the four states must scan distinct at a glance.
export const STATUS_LABEL: Record<string, string> = {
  forming: "Forming",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

export const STATUS_BADGE: Record<string, string> = {
  forming: "bg-[#F8EDD9] text-[#8A5F14]",
  active: "bg-[#E0ECE9] text-primary",
  paused: "bg-[#F3E1E0] text-[#8A2A21]",
  completed: "bg-black/[0.04] text-text-secondary",
};

// One mark everywhere, tinted by state: circles stop feeling generic
// without leaving the token palette (no custom artwork, no new hues).
export const IDENTITY_WASH: Record<string, string> = {
  forming: "bg-[#F8EDD9] text-[#8A5F14]",
  active: "bg-primary/10 text-primary",
  paused: "bg-[#F3E1E0] text-[#8A2A21]",
  completed: "bg-black/[0.04] text-text-secondary",
};

// Directory order, not home's urgency rank: live circles first,
// history last, alphabetical within a state.
export const STATUS_RANK: Record<string, number> = {
  active: 0,
  forming: 1,
  paused: 2,
  completed: 3,
};

export const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: "NGN", symbol: "₦", label: "Naira" },
  { code: "GHS", symbol: "GH₵", label: "Cedi" },
  { code: "KES", symbol: "KSh", label: "Kenyan shilling" },
  { code: "UGX", symbol: "USh", label: "Ugandan shilling" },
];

export const COUNTRY_TO_CURRENCY: Record<CountryKey, Currency> = {
  NG: "NGN",
  GH: "GHS",
  KE: "KES",
  UG: "UGX",
};

export const TIMEZONE_TO_CURRENCY: Record<string, Currency> = {
  "Africa/Lagos": "NGN",
  "Africa/Accra": "GHS",
  "Africa/Nairobi": "KES",
  "Africa/Kampala": "UGX",
};
