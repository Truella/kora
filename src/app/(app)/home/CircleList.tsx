import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { currencySymbol } from "@/lib/money";
import type { HomeCircle, HomeSnapshot } from "@/lib/home";
import ProgressBar from "./ProgressBar";

// At most three, ranked by the data layer: anything with money due (soonest
// first), then circles still waiting on a schedule because that needs the
// organizer to act, then the rest.
export default function CircleList({ snapshot }: { snapshot: HomeSnapshot }) {
  const { circles, circlesTotal } = snapshot;
  if (circles.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Your circles
        </h2>
        <Link
          href="/groups"
          className="flex items-center gap-1 text-sm font-semibold text-text-primary hover:text-primary"
        >
          See all
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Link>
      </div>

      <ul className="flex flex-col gap-3">
        {circles.map((circle) => (
          <li key={circle.groupId}>
            <CircleCard circle={circle} />
          </li>
        ))}
      </ul>

      {circlesTotal > circles.length && (
        <p className="text-xs text-text-secondary">
          +{circlesTotal - circles.length} more circle
          {circlesTotal - circles.length === 1 ? "" : "s"}
        </p>
      )}
    </section>
  );
}

function CircleCard({ circle }: { circle: HomeCircle }) {
  const symbol = currencySymbol(circle.currency);

  return (
    <Link
      href={circle.href}
      className="flex flex-col gap-3 rounded-[14px] border-[0.5px] border-border bg-surface p-4 hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate font-display text-lg font-semibold text-text-primary">
          {circle.name}
        </p>
        {circle.urgent && (
          <span className="shrink-0 rounded-full bg-[#F3E1E0] px-2.5 py-0.5 text-[11px] font-semibold text-[#8A2A21]">
            Due
          </span>
        )}
      </div>

      {circle.awaitingSchedule ? (
        <p className="text-xs leading-5 text-text-secondary">
          Waiting for schedule — the organizer starts the rotation once
          membership settles.
        </p>
      ) : circle.showBar ? (
        <>
          <p className="font-display text-sm font-semibold tabular-nums text-text-primary">
            {symbol}
            {circle.savedLabel}
            <span className="font-normal text-text-secondary">
              {" "}
              / {symbol}
              {circle.targetLabel}
            </span>
          </p>
          <ProgressBar
            percent={circle.percent}
            label={`${circle.cyclesSettled} of ${circle.cyclesEnrolled} contributions paid`}
          />
          {/* A payout the member cannot act on is explained here rather than
              parked in the attention queue, where it would be a dead row. */}
          {circle.payoutNote && (
            <p className="text-xs text-text-secondary">{circle.payoutNote}</p>
          )}
          {circle.nextDueLabel && (
            <p className="text-xs text-text-secondary">
              Next contribution · {circle.nextDueLabel}
            </p>
          )}
        </>
      ) : (
        /* 0-of-0 is not a number. A member who joined after every cycle ran
           genuinely owes nothing, and the card says so rather than claiming
           a perfect score. */
        <p className="text-xs leading-5 text-text-secondary">
          Not started — no contributions due in this circle.
        </p>
      )}
    </Link>
  );
}
