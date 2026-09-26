# Design Tokens — Kora

Petrol teal + brass gold, light mode. Built for a trust-based digital
savings circle app (Ajo/Chama). Every status color occupies its own hue
lane — no overlap between "confirm/approve" and "warning/overdue."

## Palette

| Token            | Hex       | Role                                                                                                              |
| ---------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| `primary`        | `#14524F` | All money-moving CTAs: confirm contribution, approve vote, primary buttons                                        |
| `primary-hover`  | `#0E3B39` | Hover/active/pressed state of primary buttons only                                                                |
| `accent`         | `#BF9A4E` | Small warm accents only — trust-score badges, labels on dark cards, streak/value icons. Never a large fill or CTA |
| `hero-bg`        | `#0B2624` | Single highest-attention card per screen (payout amount, balance summary). Keep it rare                           |
| `bg`             | `#F2F4F2` | Cool neutral page/app background; keeps white product surfaces distinct without returning to a cream cast         |
| `surface`        | `#FFFFFF` | Any card or list row sitting on the page background                                                               |
| `border`         | `#DDE3DF` | 0.5px hairline borders on surface cards                                                                           |
| `text-primary`   | `#16201D` | Headings, primary body text                                                                                       |
| `text-secondary` | `#5B645E` | Meta text: timestamps, subtext (or `text-primary` at 50–60% opacity)                                              |
| `success`        | `#2E7D6E` | Confirmed contributions, positive ledger amounts, "voted approve". Status/text only — never a button fill         |
| `warning`        | `#D9992E` | "Due soon" states, upcoming deadlines                                                                             |
| `danger`         | `#B23A2E` | Overdue, declined votes, failed payments. The _only_ warm-red hue in the system                                   |

Badge tints (pill backgrounds, ~15–20% tint + darker same-hue text):

| Badge                       | Background | Text      |
| --------------------------- | ---------- | --------- |
| Trust (gold)                | `#F3EDDF`  | `#7A6028` |
| Paid / approve (success)    | `#E0ECE9`  | `#1E5A4E` |
| Due soon (warning)          | `#F8EDD9`  | `#8A5F14` |
| Overdue / declined (danger) | `#F3E1E0`  | `#8A2A21` |

## Type

| Role             | Typeface        | Used for                                                                               |
| ---------------- | --------------- | -------------------------------------------------------------------------------------- |
| Headings + money | **Sora**        | Screen titles, group names, and every money figure (semibold) — never mono for amounts |
| Body / UI        | **Hind**        | Forms, nav, buttons, general body text                                                 |
| Micro-labels     | **Roboto Mono** | Technical metadata only — eyebrows, hex codes, vote tallies. Never amounts             |

## Shape

- **Radius:** 20px page-level sheets/containers (incl. the hero card), 14px
  cards, 10px buttons and list rows, pill badges.
- **Buttons:** full-width primary buttons use `primary` fill, white text,
  ~13px vertical padding, 10px radius. Secondary/decline buttons: white fill,
  `text-primary` text, 0.5px `border` outline — no fill color, so they never
  compete visually with a destructive action.
- **Badges** (e.g. trust score): pill shape, tinted background + darker
  same-hue text (table above) — never flat `accent` fills.
- **List rows:** `surface` background, `border` hairline, sit directly on `bg`.

## Hard rules — do not

- Do not use `accent` (gold) as a CTA/button background. Accent only.
- Do not introduce a second red/orange hue. `danger` must remain the only
  warning-coded hue in the system.
- Do not reuse `hero-bg` on more than one card per screen.
- Do not use `success` as a button fill — it stays distinct from the primary
  CTA color by living only in ledger/status text.

## Loading fonts (`src/app/layout.tsx`)

Use `next/font/google` rather than a runtime `<link>` tag — self-hosts the
fonts at build time (faster, no external request, works offline in the PWA
shell).

```tsx
import { Sora, Hind, Roboto_Mono } from "next/font/google";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const hind = Hind({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});
```

## Tailwind v4 theme (`src/app/globals.css`)

```css
@import "tailwindcss";

@theme {
  --color-primary: #14524f;
  --color-primary-hover: #0e3b39;
  --color-accent: #bf9a4e;
  --color-hero-bg: #0b2624;
  --color-bg: #f2f4f2;
  --color-surface: #ffffff;
  --color-border: #dde3df;
  --color-text-primary: #16201d;
  --color-text-secondary: #5b645e;
  --color-success: #2e7d6e;
  --color-warning: #d9992e;
  --color-danger: #b23a2e;

  --font-display: "Sora", system-ui, sans-serif;
  --font-sans: "Hind", system-ui, sans-serif;
  --font-mono: "Roboto Mono", ui-monospace, monospace;
}
```

This gives you utilities immediately: `bg-primary`, `text-text-secondary`,
`border-border`, `bg-hero-bg`, `font-display`, `font-mono`, etc.

## Status mapping (applied app-wide 9/24)

- `pending` contributions → warning tint (`#F8EDD9` / `#8A5F14`).
- `paid` / `completed` / `approve` → success tint (`#E0ECE9` / `#1E5A4E`).
- `late` / overdue / `failed` / declined / rejected → danger tint
  (`#F3E1E0` / `#8A2A21`). Late is settled money with a trust hit, so it
  reads danger, not warning.
- Trust pills → gold tint (`#F3EDDF` / `#7A6028`) everywhere (circle
  members, profile per-circle list).
- Inline status text: `text-success` (confirmed), `text-warning` (due
  soon), `text-danger` (overdue/failed/late-copy).
- Errors (validation, failed sends) → `text-danger` or danger-tint panels —
  never body-color text.
