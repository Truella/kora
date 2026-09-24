import type { HomeSnapshot } from "@/lib/home";

const GREETING = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
} as const;

// Deliberately not the hero card. The design system reserves hero-bg for a
// single highest-attention mass per screen, and the thing that most needs
// shouting on this page is the attention queue directly below — a petrol hero
// sitting above it flattens the gold and clay urgency tints. Plain surface,
// hairline border, large petrol numerals: one warm card on the screen.
export default function Summary({ snapshot }: { snapshot: HomeSnapshot }) {
  const { totals, greeting, firstName } = snapshot;

  // A card whose entire content is ₦0 teaches nothing and still takes the top
  // of the screen. The reason it is zero — a first payment pending — is
  // already in the attention queue.
  if (!totals.hasAny) return null;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
        {GREETING[greeting]}
        {firstName ? `, ${firstName}` : ""}
      </h1>

      <div className="flex flex-col gap-4 rounded-[14px] border-[0.5px] border-border bg-surface p-5">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary">
            Total contributed
          </p>
          <p className="mt-1 font-display text-4xl font-semibold tabular-nums text-primary">
            {totals.contributed.label}
          </p>
          {totals.received && (
            <p className="mt-1 text-sm text-text-secondary">
              {totals.received.label} received
            </p>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary">
            This month
          </p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-text-primary">
            {totals.month.label}
          </p>
          {/* A count, not a ↑ arrow. With fresh demo data the previous month is
              often ₦0, so a comparison arrow would be claiming a trend that
              isn't there. */}
          <p className="mt-0.5 text-xs text-text-secondary">
            {totals.monthCount === 0
              ? `No contributions in ${totals.monthName} yet`
              : `${totals.monthCount} contribution${totals.monthCount === 1 ? "" : "s"} in ${totals.monthName}`}
          </p>
        </div>

        {totals.others.map((other) => (
          <p
            key={other.currency}
            className="border-t border-border pt-3 text-xs text-text-secondary"
          >
            Also {other.label} in {other.circleCount} circle
            {other.circleCount === 1 ? "" : "s"}
          </p>
        ))}
      </div>
    </section>
  );
}
