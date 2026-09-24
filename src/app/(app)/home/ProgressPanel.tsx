import type { HomeSnapshot } from "@/lib/home";

// A compact record of payment reliability, not another decorative percentage.
// It only appears once there is a settled payment to describe, and the ring,
// numerator and denominator all encode the same real on-time ratio.
export default function ProgressPanel({ snapshot }: { snapshot: HomeSnapshot }) {
  const { paymentProgress } = snapshot;
  if (paymentProgress.settledCount === 0) return null;

  const ringColor =
    paymentProgress.lateCount === 0 ? "#2E7D6E" : "#D9992E";

  return (
    <section className="flex min-h-full flex-col rounded-[20px] border-[0.5px] border-border bg-surface p-5 shadow-[0_12px_30px_rgba(11,38,36,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
            Your progress
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-text-primary">
            Payment record
          </h2>
        </div>

        <div
          role="progressbar"
          aria-label="On-time contribution rate"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={paymentProgress.percent}
          className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full p-[7px]"
          style={{
            background: `conic-gradient(${ringColor} ${paymentProgress.percent}%, #DDE3DF 0)`,
          }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-surface font-display text-base font-semibold tabular-nums text-text-primary">
            {paymentProgress.percent}%
          </div>
        </div>
      </div>

      <div className="mt-auto pt-7">
        <p className="font-display text-2xl font-semibold tabular-nums text-text-primary">
          {paymentProgress.onTimeCount} of {paymentProgress.settledCount}
        </p>
        <p className="mt-1 text-sm text-text-secondary">settled contributions on time</p>
        {paymentProgress.lateCount > 0 && (
          <p className="mt-3 text-xs font-medium text-[#8A5F14]">
            {paymentProgress.lateCount} paid late
          </p>
        )}
      </div>
    </section>
  );
}
