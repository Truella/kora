# Design Tokens — Digital Ajo/Chama App

## Palette rationale

Grounded in the *adire* indigo-dye tradition (West African hand-craft, historically tied to trade and community) rather than a generic fintech blue/green. Ledger paper background reads like a passbook page, not the warm-cream-plus-terracotta combo that's become an AI-design default.

| Token | Hex | Role |
|---|---|---|
| `ink` | `#14171F` | Text, dark surfaces |
| `indigo` | `#26306B` | Brand/primary — nav, primary buttons, group headers |
| `paper` | `#EEF0F2` | Background — main surface, ledger screen |
| `gold` | `#C98A2C` | Accent — contribution amounts, payout highlights (used sparingly) |
| `jade` | `#2F6F5E` | Positive/paid status, healthy trust score |
| `clay` | `#9C4A26` | Late/pending status — never full red, keeps tone community-accountable not punitive |

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

@theme {
  /* Colors */
  --color-ink: #14171F;
  --color-indigo: #26306B;
  --color-paper: #EEF0F2;
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
- **Gold accent:** reserve for money-specific highlights (contribution due, payout amount) — don't apply to every button or it stops meaning anything.
- **Jade/Clay:** paid vs. late contribution status, and the trust score display. Decide with your teammate whether trust score renders as a jade→clay gradient by score, or stays binary paid/late.
- **Newsreader:** group names, empty-state copy, trust-score narrative lines — not nav, not buttons, not form labels (those stay Plex Sans).
