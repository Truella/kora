import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  UserGroupIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import type { HomeActivity, HomeSnapshot } from "@/lib/home";
import SectionHead from "./SectionHead";

// Settled events only. Everything still upcoming already lives in the Next Up
// surface or the attention queue. Each event gets a visual anchor and its round,
// so the feed reads as movement in the rotation rather than anonymous ledger
// lines.
export default function ActivityStrip({ snapshot }: { snapshot: HomeSnapshot }) {
  const { activity } = snapshot;
  if (activity.length === 0) return null;

  return (
    <section className="rounded-[20px] border-[0.5px] border-border bg-surface p-5 shadow-[0_12px_30px_rgba(11,38,36,0.05)]">
      <SectionHead title="Recent activity" href="/activity" />

      <ul className="mt-2 flex flex-col gap-1">
        {activity.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

function ActivityRow({ item }: { item: HomeActivity }) {
  const visual = ACTIVITY_VISUALS[item.tone];

  return (
    <li className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-[12px] px-1 py-2.5 transition-colors hover:bg-black/[0.02]">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${visual.className}`}
      >
        <HugeiconsIcon icon={visual.icon} size={17} strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text-primary">
          {item.headline}
        </p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">
          {item.groupName}
          {item.contextLabel ? ` · ${item.contextLabel}` : ""}
        </p>
      </div>
      <div className="text-right">
        <p className="font-display text-sm font-semibold tabular-nums text-text-primary">
          {item.amountLabel}
        </p>
        <p className="mt-0.5 text-[11px] text-text-secondary">{item.dayLabel}</p>
      </div>
    </li>
  );
}

const ACTIVITY_VISUALS = {
  paid: {
    icon: CheckmarkCircle01Icon,
    className: "bg-[#E0ECE9] text-success",
  },
  received: {
    icon: Wallet01Icon,
    className: "bg-[#F3EDDF] text-[#7A6028]",
  },
  "circle-payout": {
    icon: UserGroupIcon,
    className: "bg-[#E0ECE9] text-primary",
  },
} as const;
