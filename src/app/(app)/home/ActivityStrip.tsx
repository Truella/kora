import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { HomeSnapshot } from "@/lib/home";

// Settled events only. Everything still upcoming already lives in the
// attention queue directly above, and repeating it here would undo that
// separation — which is the whole reason the queue owns the next contribution.
export default function ActivityStrip({ snapshot }: { snapshot: HomeSnapshot }) {
  const { activity } = snapshot;
  if (activity.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Recent activity
        </h2>
        <Link
          href="/activity"
          className="flex items-center gap-1 text-sm font-semibold text-text-primary hover:text-primary"
        >
          See all
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Link>
      </div>

      <ul className="flex flex-col gap-2">
        {activity.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">
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
