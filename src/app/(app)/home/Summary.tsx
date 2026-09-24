import type { HomeSnapshot } from "@/lib/home";

const GREETING = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
} as const;

// No card. Two numbers do not need a border and 20px of padding, and boxing
// them made the summary compete with the circles underneath it — every element
// on the page ended up with the same weight, which is the one thing a command
// centre cannot afford. Hierarchy now comes from type size alone: the figure is
// the largest thing here, and the label under it is a whisper.
//
// Still not the hero. hero-bg is reserved for a single highest-attention mass
// per screen, and on this page that is the attention queue — a petrol block up
// here would flatten the gold and clay urgency tints below it.
export default function Summary({ snapshot }: { snapshot: HomeSnapshot }) {
  const { totals, greeting, firstName } = snapshot;

  return (
    <section className="flex flex-col">
      {/* The greeting is not conditional on having money. A member with circles
          but nothing settled yet still gets greeted — only the figures drop
          away, because a card of zeroes teaches nothing. */}
      <h1 className="font-display text-xl font-semibold tracking-tight text-text-primary">
        {GREETING[greeting]}
        {firstName ? `, ${firstName}` : ""}
      </h1>

      {totals.hasAny && (
        <div className="mt-4 flex flex-col">
          <p className="font-display text-4xl font-semibold tabular-nums text-primary">
            {totals.contributed.label}
          </p>
          <p className="mt-0.5 text-sm text-text-secondary">total contributed</p>

          {/* Lifetime figures first, then the period figure — the order the eye
              reads them in. A count, not a ↑ arrow: with fresh demo data the
              previous month is often zero, so a comparison arrow would be
              claiming a trend that is not there. */}
          {totals.received && (
            <p className="mt-2 text-sm text-text-secondary">
              {totals.received.label} received
            </p>
          )}

          <p className="text-sm text-text-secondary">
            {totals.monthCount === 0
              ? `No contributions in ${totals.monthName} yet`
              : `${totals.month.label} this month · ${totals.monthCount} contribution${totals.monthCount === 1 ? "" : "s"}`}
          </p>

          {/* No FX conversion — a second currency is reported on its own terms
              rather than pretending to be comparable. */}
          {totals.others.map((other) => (
            <p key={other.currency} className="text-sm text-text-secondary">
              Also {other.label} in {other.circleCount} circle
              {other.circleCount === 1 ? "" : "s"}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
