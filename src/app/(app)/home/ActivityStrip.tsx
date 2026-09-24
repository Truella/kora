import type { HomeSnapshot } from "@/lib/home";
import SectionHead from "./SectionHead";

// Settled events only. Everything still upcoming already lives in the attention
// queue, and repeating it here would undo that separation — which is the whole
// reason the queue owns the next contribution.
export default function ActivityStrip({ snapshot }: { snapshot: HomeSnapshot }) {
  const { activity } = snapshot;
  if (activity.length === 0) return null;

  return (
    <section className="flex flex-col gap-1">
      <SectionHead title="Recent activity" href="/activity" />

      <ul className="divide-y divide-border">
        {activity.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">
                {item.headline}
              </p>
              <p className="truncate text-xs text-text-secondary">
                {item.groupName}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-sm font-semibold tabular-nums text-text-primary">
                {item.amountLabel}
              </p>
              <p className="text-[11px] text-text-secondary">{item.dayLabel}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
