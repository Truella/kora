# Design Tokens — Digital Ajo/Chama App

## Palette rationale

Grounded in the *adire* indigo-dye tradition (West African hand-craft, historically tied to trade and community) rather than a generic fintech blue/green. Three colors only: paper surfaces, indigo text and structure, gold emphasis. Muted text is indigo at opacity; settled states render indigo, attention states (pending, late, errors) render gold — wording and icons carry the meaning red used to.

| Token | Hex | Role |
|---|---|---|
| `indigo` | `#21164F` | Default — text, nav, structure, settled states, ALL actions |
| `indigo-hover` | `#30205F` | Hover lift on indigo surfaces — actions lighten on hover, never darken |
| `paper` | `#FAF9F6` | Background — main surface (warm paper, dominant, never large purple areas in-app) |
| `gold` | `#C9A84E` | Value/status/identity only — amounts, badges, trust, logo details. Antique, never bright yellow. Never a button. |
| `gold-deep` | `#9D7B2F` | Amount figures and hover depth on gold-tinted surfaces |

Light-only theme: no `dark:` variants ship — every screen renders this system regardless of OS setting.

## Type rationale

| Role | Typeface | Used for |
|---|---|---|
| Headline / editorial voice | **Newsreader** (serif) | Group names, empty states, trust-score narrative copy — used sparingly, not on every label |
| UI / body | **IBM Plex Sans** | Forms, nav, buttons, general body text |
| Ledger figures | **IBM Plex Mono** | Every amount in the ledger, contribution screen, payout view — tabular numerals so figures align and don't jitter on update |

---

## Tailwind v4 theme (`src/app/globals.css`)

```css
@import "tailwindcss";

/* Light-only: paper/indigo/gold always. */
@theme {
  /* Colors — heritage palette: deep community-indigo, antique gold */
  --color-indigo: #21164f;
  --color-indigo-hover: #30205f;
  --color-paper: #faf9f6;
  --color-gold: #c9a84e;
  --color-gold-deep: #9d7b2f;

  /* Fonts */
  --font-display: "Newsreader", serif;
  --font-sans: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}

body {
  background-color: var(--color-paper);
  color: var(--color-indigo);
}
```

This gives you utilities immediately: `bg-indigo`, `text-paper`, `border-gold`, `font-display`, `font-mono`, etc.

## Loading fonts (`src/app/layout.tsx`)

Use `next/font/google` rather than a runtime `<link>` tag — self-hosts the fonts at build time (faster, no external request, works offline in the PWA shell).

```tsx
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

## Usage guide

- **Ledger/contribution amounts:** always `font-mono` with tabular figures — this is what makes the ledger screen feel like a real passbook rather than a generic list.
- **Gold:** value/status/identity only — amounts, badges, trust pills, logo details. Antique, never bright yellow, never a button. Attention states (pending, late, errors) use gold-tinted panels paired with explicit copy and icons, since red is gone.
- **Settled states:** paid and success render indigo — the brand color carries confirmation.
- **The rule: indigo = action, gold = value.** Create, pay, join, approve → indigo. ₦10,000, "your share", trust, status → gold. Gold must never compete as a second primary.
- **Newsreader:** group names, empty-state copy, trust-score narrative lines — not nav, not buttons, not form labels (those stay Plex Sans).
