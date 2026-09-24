import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design System Preview",
};

// TEMP route — petrol/brass design-system preview. DELETE before submission
// (plus its proxy exemption in src/proxy.ts and chrome exemptions in
// AppHeader.tsx / AppNav.tsx).

const SWATCHES = [
  { name: "primary", hex: "#14524F", cls: "bg-primary text-white", note: "money CTAs" },
  { name: "primary-hover", hex: "#0E3B39", cls: "bg-primary-hover text-white", note: "CTA press only" },
  { name: "accent", hex: "#BF9A4E", cls: "bg-accent text-white", note: "small accents only" },
  { name: "hero-bg", hex: "#0B2624", cls: "bg-hero-bg text-white", note: "one card / screen" },
  { name: "bg", hex: "#F7F6F1", cls: "bg-bg text-text-primary border-[0.5px] border-border", note: "page only" },
  { name: "surface", hex: "#FFFFFF", cls: "bg-surface text-text-primary border-[0.5px] border-border", note: "cards + rows" },
  { name: "border", hex: "#E5E1D6", cls: "bg-border text-text-primary", note: "0.5px hairlines" },
  { name: "text-primary", hex: "#16201D", cls: "bg-text-primary text-white", note: "headings + body" },
  { name: "text-secondary", hex: "#5B645E", cls: "bg-text-secondary text-white", note: "timestamps, subtext" },
  { name: "success", hex: "#2E7D6E", cls: "bg-success text-white", note: "confirmed, status text" },
  { name: "warning", hex: "#D9992E", cls: "bg-warning text-white", note: "due soon" },
  { name: "danger", hex: "#B23A2E", cls: "bg-danger text-white", note: "only warm-red hue" },
];

const LEDGER = [
  { who: "Ada", detail: "Round 3 · confirmed Tue 14:02", amount: "+₦10,000", state: "text-success", label: "Confirmed" },
  { who: "You", detail: "Round 4 · voted approve", amount: "₦10,000", state: "text-success", label: "Voted approve" },
  { who: "Chidi", detail: "Round 4 · due Fri 26 Sep", amount: "₦10,000", state: "text-warning", label: "Due soon" },
  { who: "Musa", detail: "Round 3 · 4 days overdue", amount: "₦10,000", state: "text-danger", label: "Overdue" },
];

export default function DesignPreview() {
  return (
    <div className="min-h-dvh bg-bg font-sans text-text-primary">
      <div className="mx-auto w-full max-w-md px-4 pb-20 pt-10">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary">
          Kora · design system · temp /design
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
          Petrol &amp; brass.
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-text-secondary">
          Trust-based savings circles. One hero card per screen, one warm-red
          hue in the whole system, and gold that never shouts.
        </p>

        {/* Type */}
        <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
          Type
        </h2>
        <div className="mt-3 space-y-3">
          <div className="rounded-[14px] border-[0.5px] border-border bg-surface p-4">
            <p className="font-display text-[22px] font-semibold leading-7">
              Lagos Market Circle
            </p>
            <p className="mt-1 font-mono text-xs text-text-secondary">
              Sora — headings + money
            </p>
          </div>
          <div className="rounded-[14px] border-[0.5px] border-border bg-surface p-4">
            <p className="text-[15px] leading-6">
              Everyone pays every round, and the pot goes to the named
              receiver. The organizer sets the schedule — never holds the
              money.
            </p>
            <p className="mt-1 font-mono text-xs text-text-secondary">
              Hind — body, labels, buttons
            </p>
          </div>
          <div className="rounded-[14px] border-[0.5px] border-border bg-surface p-4">
            <p className="font-display text-2xl font-semibold tabular-nums">
              ₦50,000.00
            </p>
            <p className="mt-1 font-mono text-xs text-text-secondary">
              Sora semibold — every amount, never mono
            </p>
          </div>
        </div>

        {/* Palette */}
        <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
          Palette
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {SWATCHES.map((s) => (
            <div
              key={s.name}
              className="overflow-hidden rounded-[14px] border-[0.5px] border-border bg-surface"
            >
              <div className={`flex h-16 items-end p-2.5 ${s.cls}`}>
                <span className="font-mono text-xs font-medium">{s.hex}</span>
              </div>
              <div className="px-3 py-2">
                <p className="font-mono text-xs font-semibold">{s.name}</p>
                <p className="text-xs text-text-secondary">{s.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Hero card — the single highest-attention element */}
        <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
          Hero card
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          One per screen. Nothing else gets this background.
        </p>
        <div className="mt-3 rounded-[20px] bg-hero-bg p-6 text-white">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Next payout · Round 4
            </p>
            <span className="rounded-full bg-accent/20 px-3 py-1 font-mono text-[11px] font-semibold text-[#E8CF8E]">
              Trust 92
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums">
            ₦50,000
          </p>
          <p className="mt-2 text-[15px] leading-6 text-white/80">
            Ada receives · due Fri 26 Sep
          </p>
          <p className="mt-1 text-sm text-white/60">
            Lagos Market Circle · 5 members · ₦10,000 weekly
          </p>
        </div>

        {/* Money CTA */}
        <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
          Money CTA
        </h2>
        <div className="mt-3 rounded-[14px] border-[0.5px] border-border bg-surface p-4">
          <p className="text-[15px] font-semibold">Your share · Round 4</p>
          <p className="mt-0.5 font-display text-sm font-semibold tabular-nums text-text-secondary">
            ₦10,000 · due Fri 26 Sep
          </p>
          <button
            type="button"
            className="mt-4 w-full rounded-[10px] bg-primary py-[13px] text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Confirm contribution
          </button>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-[10px] border-[0.5px] border-border bg-white py-[13px] text-[15px] font-semibold text-text-primary"
            >
              Decline
            </button>
            <button
              type="button"
              className="flex-1 rounded-[10px] bg-primary py-[13px] text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Approve
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-text-secondary">
            Primary fills are petrol only. Decline stays white with a hairline
            — it never competes with a destructive action, and success green
            never fills a button.
          </p>
        </div>

        {/* Ledger rows */}
        <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
          Ledger
        </h2>
        <div className="mt-3 space-y-2">
          {LEDGER.map((row) => (
            <div
              key={row.who + row.label}
              className="flex items-center gap-3 rounded-[10px] border-[0.5px] border-border bg-surface px-3 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
                {row.who.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold leading-5">
                  {row.who}
                  <span className={`ml-2 text-[13px] font-medium ${row.state}`}>
                    {row.label}
                  </span>
                </span>
                <span className="block truncate text-xs text-text-secondary">
                  {row.detail}
                </span>
              </span>
              <span
                className={`font-display text-[15px] font-semibold tabular-nums ${row.state}`}
              >
                {row.amount}
              </span>
            </div>
          ))}
        </div>

        {/* Join vote */}
        <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
          Join vote
        </h2>
        <div className="mt-3 rounded-[14px] border-[0.5px] border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] font-semibold">Chidi wants to join</p>
            <span className="shrink-0 font-mono text-xs tabular-nums text-text-secondary">
              3/5 approvals
            </span>
          </div>
          <p className="mt-0.5 text-sm text-text-secondary">
            Invited by Ada · waiting on 2 votes
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-[10px] bg-primary py-[13px] text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Approve
            </button>
            <button
              type="button"
              className="flex-1 rounded-[10px] border-[0.5px] border-border bg-white py-[13px] text-[15px] font-semibold text-text-primary"
            >
              Reject
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-text-secondary">
            Rejection reads as text + outline. The only red in the system is
            reserved for overdue and failed payments.
          </p>
        </div>

        {/* Badges */}
        <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
          Badges
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Pill shape, tinted backgrounds — never flat accent fills.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 rounded-[14px] border-[0.5px] border-border bg-surface p-4">
          <span className="rounded-full bg-[#F3EDDF] px-3 py-1 text-[13px] font-semibold text-[#7A6028]">
            Trust 92
          </span>
          <span className="rounded-full bg-[#E0ECE9] px-3 py-1 text-[13px] font-semibold text-[#1E5A4E]">
            Paid
          </span>
          <span className="rounded-full bg-[#E0ECE9] px-3 py-1 text-[13px] font-semibold text-[#1E5A4E]">
            Voted approve
          </span>
          <span className="rounded-full bg-[#F8EDD9] px-3 py-1 text-[13px] font-semibold text-[#8A5F14]">
            Due soon
          </span>
          <span className="rounded-full bg-[#F3E1E0] px-3 py-1 text-[13px] font-semibold text-[#8A2A21]">
            Overdue
          </span>
          <span className="rounded-full bg-[#F3E1E0] px-3 py-1 text-[13px] font-semibold text-[#8A2A21]">
            Declined
          </span>
        </div>

        {/* Hard rules */}
        <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
          Hard rules
        </h2>
        <ul className="mt-3 space-y-2">
          {[
            "Gold is an accent, never a CTA background.",
            "Danger #B23A2E is the only warm-red hue — nothing close to it.",
            "One hero-bg card per screen, or it loses its weight.",
            "Success green is status text — never a button fill.",
          ].map((rule) => (
            <li
              key={rule}
              className="flex gap-3 rounded-[10px] border-[0.5px] border-border bg-surface px-3 py-3 text-[14px] leading-5"
            >
              <span aria-hidden className="font-mono font-semibold text-success">
                ✓
              </span>
              {rule}
            </li>
          ))}
        </ul>

        <p className="mt-10 font-mono text-xs leading-5 text-text-secondary">
          TEMP preview at /design — delete before submission, along with the
          proxy + chrome exemptions and the legacy token block.
        </p>
      </div>
    </div>
  );
}
