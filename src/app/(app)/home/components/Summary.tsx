import { HugeiconsIcon } from "@hugeicons/react";
import { Wallet01Icon } from "@hugeicons/core-free-icons";
import type { HomeSnapshot } from "@/lib/home";

// The one hero surface on the dashboard. It answers the broad financial
// question — how much has gone into circles — while the neighbouring Next Up
// card answers the immediate temporal one. The petrol/brass gradient is used
// here only; every other card stays on white so this remains the visual anchor.
export default function Summary({ snapshot }: { snapshot: HomeSnapshot }) {
  const { totals, activeCircleCount } = snapshot;

  return (
    <section className="relative flex min-h-[248px] flex-col overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_88%_8%,rgba(191,154,78,0.26),transparent_34%),linear-gradient(135deg,#0B2624_0%,#14524F_125%)] p-5 text-white shadow-[0_18px_42px_rgba(11,38,36,0.16)] sm:p-6">
      <div
        aria-hidden
        className="absolute -right-16 -top-20 h-52 w-52 rounded-full border border-white/10"
      />
      <div
        aria-hidden
        className="absolute -right-7 -top-10 h-32 w-32 rounded-full border border-white/10"
      />

      <div className="relative flex items-start justify-between gap-4">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
          Total contributed
        </p>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#E2C98F]">
          <HugeiconsIcon icon={Wallet01Icon} size={18} strokeWidth={1.8} />
        </span>
      </div>

      <div className="relative mt-5">
        <p className="font-display text-4xl font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-5xl">
          {totals.contributed.label}
        </p>
        <p className="mt-2 text-sm text-white/65">
          {totals.hasAny
            ? "Saved across your savings circles"
            : "Your circle contributions will appear here"}
        </p>
        {totals.received && (
          <p className="mt-3 text-sm font-medium text-[#E2C98F]">
            {totals.received.label} received
          </p>
        )}
        {totals.others.map((other) => (
          <p key={other.currency} className="mt-1 text-xs text-white/55">
            Also {other.label} across {other.circleCount} circle
            {other.circleCount === 1 ? "" : "s"}
          </p>
        ))}
      </div>

      <div className="relative mt-auto grid grid-cols-2 gap-3 pt-6">
        <div>
          <p className="font-display text-lg font-semibold tabular-nums">
            {activeCircleCount}
          </p>
          <p className="mt-0.5 text-xs text-white/60">
            active circle{activeCircleCount === 1 ? "" : "s"}
          </p>
        </div>
        <div>
          <p className="font-display text-lg font-semibold tabular-nums">
            {totals.monthCount}
          </p>
          <p className="mt-0.5 text-xs text-white/60">
            contribution{totals.monthCount === 1 ? "" : "s"} this month
          </p>
        </div>
      </div>
    </section>
  );
}
