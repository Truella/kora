# Design Tokens — Digital Ajo/Chama App

## Palette rationale

Grounded in the *adire* indigo-dye tradition (West African hand-craft, historically tied to trade and community) rather than a generic fintech blue/green. White is the main color, gold the primary accent, indigo secondary — no neutral black anywhere: surfaces are white, text runs on deep indigo.

| Token | Hex | Role |
|---|---|---|
| `ink` | `#232B5C` | Text — deep indigo, never neutral black |
| `indigo` | `#26306B` | Secondary — nav, sidebar active, headlines on light panels |
| `paper` | `#FFFFFF` | Background — main surface |
| `mist` | `#EEF0F2` | Alt band — landing sections, tab tracks, ledger mock rows |
| `gold` | `#C98A2C` | Primary accent — CTAs, contribution amounts, payout highlights (used sparingly) |
| `jade` | `#2F6F5E` | Positive/paid status, healthy trust score |
| `clay` | `#9C4A26` | Late/pending status — never full red, keeps tone community-accountable not punitive |

Light-only theme: `dark:` variants are disabled globally (`@custom-variant`), so every screen renders this system regardless of OS setting.

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

/* Light-only: dark: variants disabled globally — white/gold/indigo always. */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Colors — no neutral black: text on deep indigo, surfaces on white */
  --color-ink: #232B5C;
  --color-indigo: #26306B;
  --color-paper: #FFFFFF;
  --color-mist: #EEF0F2;
  --color-gold: #C98A2C;
  --color-jade: #2F6F5E;
  --color-clay: #9C4A26;

  /* Fonts */
  --font-display: "Newsreader", serif;
  --font-sans: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}

body {
  background-color: var(--color-paper);
  color: var(--color-ink);
}
```

This gives you utilities immediately: `bg-indigo`, `text-jade`, `border-clay`, `font-display`, `font-mono`, etc.

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
- **Gold accent:** primary CTA color (all primary buttons, `bg-gold` + `text-ink`) plus money-specific highlights (contribution due, payout amount).
- **Jade/Clay:** paid vs. late contribution status, and the trust score display. Decide with your teammate whether trust score renders as a jade→clay gradient by score, or stays binary paid/late.
- **Newsreader:** group names, empty-state copy, trust-score narrative lines — not nav, not buttons, not form labels (those stay Plex Sans).
