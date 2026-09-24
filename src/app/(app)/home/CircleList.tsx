import Link from "next/link";
import { currencySymbol } from "@/lib/money";
import type { HomeCircle, HomeSnapshot } from "@/lib/home";
import ProgressBar from "./ProgressBar";
import SectionHead from "./SectionHead";

// At most three, ranked by the data layer: anything with money due (soonest
// first), then circles still waiting on a schedule because that needs the
// organizer to act, then the rest.
export default function CircleList({ snapshot }: { snapshot: HomeSnapshot }) {
  const { circles, circlesTotal } = snapshot;
  if (circles.length === 0) return null;

  return (
    <section className="flex flex-col gap-1">
      <SectionHead title="Your circles" href="/groups" />

      {/* Hairlines instead of cards. The page background is the surface now, so
          what separates one circle from the next is a rule and a little air. */}
      <ul className="divide-y divide-border">
        {circles.map((circle) => (
          <li key={circle.groupId}>
            <CircleRow circle={circle} />
          </li>
        ))}
      </ul>

      {circlesTotal > circles.length && (
        <p className="pt-2 text-xs text-text-secondary">
          +{circlesTotal - circles.length} more circle
          {circlesTotal - circles.length === 1 ? "" : "s"}
        </p>
      )}
    </section>
  );
}

// A savings circle is not a progress bar. It has a share, a cadence, a
// membership and a date it next asks you for money — so the row says all of
// those, and the bar is one line of it rather than the whole of it.
function CircleRow({ circle }: { circle: HomeCircle }) {
  const symbol = currencySymbol(circle.currency);
  const cadence = cadenceLabel(circle.frequency);

  return (
    <Link
      href={circle.href}
      className="flex flex-col gap-1.5 py-4 transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate font-display text-base font-semibold text-text-primary">
          {circle.name}
        </p>
        {/* The status slot only speaks when there is something to say. A badge
            reading "Active" on every row would be the same weight problem one
            level down. */}
        {circle.urgent && (
          <span className="shrink-0 rounded-full bg-[#F3E1E0] px-2 py-0.5 text-[11px] font-semibold text-[#8A2A21]">
            Due
          </span>
        )}
      </div>

      {circle.awaitingSchedule ? (
        <p className="text-sm text-text-secondary">
          Waiting for schedule — the organizer starts the rotation once
          membership settles.
        </p>
      ) : circle.showBar ? (
        <>
          <p className="text-sm tabular-nums text-text-primary">
            {symbol}
            {circle.savedLabel}
            <span className="text-text-secondary">
              {" "}
              contributed · target {symbol}
              {circle.targetLabel}
            </span>
          </p>
          <ProgressBar
            percent={circle.percent}
            label={`${circle.cyclesSettled} of ${circle.cyclesEnrolled} contributions paid`}
          />
          {circle.nextDueLabel && (
            <p className="text-xs text-text-secondary">
              Next contribution {circle.nextDueLabel} · {circle.amountLabel}
            </p>
          )}
        </>
      ) : (
        /* 0-of-0 is not a number. A member who joined after every cycle ran
           genuinely owes nothing, and the row says so rather than claiming a
           perfect score. */
        <p className="text-sm text-text-secondary">
          No contributions due in this circle yet.
        </p>
      )}

      {/* Who is in it, and how often it runs. Without these the row is a number
          and a bar; with them it is a circle of people. */}
      <p className="text-xs text-text-secondary">
        {circle.memberCount} member{circle.memberCount === 1 ? "" : "s"} ·{" "}
        {cadence}
      </p>

      {/* A payout the member cannot act on is explained here rather than parked
          in the attention queue, where it would be a dead row. */}
      {circle.payoutNote && (
        <p className="text-xs text-text-secondary">{circle.payoutNote}</p>
      )}
    </Link>
  );
}

const CADENCE: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
};

// groups.frequency is constrained to weekly|monthly by a check constraint, so
// the fallback is unreachable in practice — it just keeps an unexpected value
// from rendering as raw snake_case.
function cadenceLabel(frequency: string): string {
  return CADENCE[frequency] ?? frequency;
}
