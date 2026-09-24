import Link from "next/link";
import type { HomeCircle, HomeSnapshot } from "@/lib/home";
import ProgressBar from "./ProgressBar";
import SectionHead from "./SectionHead";
import CircleAttentionTooltip from "./CircleAttentionTooltip";

// Circles are the product, so they get the page's largest repeated surface.
// The list is capped and ranked by the data layer: anything with money due
// (soonest first), then circles waiting on a schedule, then the rest.
export default function CircleList({ snapshot }: { snapshot: HomeSnapshot }) {
  const { circles, circlesTotal } = snapshot;
  if (circles.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHead title="Your circles" href="/groups" />

      <ul className="grid gap-4 md:grid-cols-2">
        {circles.map((circle) => (
          <li key={circle.groupId}>
            <CircleCard circle={circle} />
          </li>
        ))}
      </ul>

      {circlesTotal > circles.length && (
        <p className="text-xs text-text-secondary">
          +{circlesTotal - circles.length} more circle
          {circlesTotal - circles.length === 1 ? "" : "s"} in your full list
        </p>
      )}
    </section>
  );
}

function CircleCard({ circle }: { circle: HomeCircle }) {
  const cadence = cadenceLabel(circle.frequency);
  const attention = circleAttention(circle);

  return (
    <Link
      href={circle.href}
      className="flex flex-col rounded-[20px] border-[0.5px] border-border bg-surface p-5 shadow-[0_12px_30px_rgba(11,38,36,0.05)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_40px_rgba(11,38,36,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:translate-y-0 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold tracking-tight text-text-primary">
            {circle.name}
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            {cadence} savings circle
          </p>
        </div>
        {attention && (
          <CircleAttentionTooltip
            kind={attention.kind}
            label={attention.label}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${attention.className}`}
          />
        )}
      </div>

      {circle.awaitingSchedule ? (
        <div className="mt-6 rounded-[14px] bg-[#F8EDD9] px-4 py-4">
          <p className="font-display text-base font-semibold text-text-primary">
            Waiting for schedule
          </p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">
            The organizer starts the rotation once membership settles.
          </p>
        </div>
      ) : circle.showBar ? (
        <div className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-base font-semibold tabular-nums text-text-primary">
              {circle.savedLabel}
              <span className="font-normal text-text-secondary">
                {" "}
                / {circle.targetLabel}
              </span>
            </p>
            <p className="shrink-0 text-[11px] tabular-nums text-text-secondary">
              {circle.cyclesSettled}/{circle.cyclesEnrolled} settled
            </p>
          </div>
          <div className="mt-3">
            <ProgressBar
              percent={circle.percent}
              label={`${circle.cyclesSettled} of ${circle.cyclesEnrolled} contributions paid`}
            />
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[14px] bg-black/[0.025] px-4 py-4">
          <p className="text-sm font-medium text-text-primary">
            No contributions due in this circle yet
          </p>
        </div>
      )}

      {circle.status === "completed" && (
        <div className="mt-3 rounded-[14px] bg-[#E0ECE9] px-4 py-3 text-sm font-semibold text-primary">
          Rotation complete
        </div>
      )}

      {circle.nextDueLabel && (
        <p className="mt-auto pt-4 text-xs text-text-secondary">
          Next contribution {circle.nextDueLabel} · {circle.amountLabel}
        </p>
      )}
    </Link>
  );
}

const CADENCE: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
};

function cadenceLabel(frequency: string): string {
  return CADENCE[frequency] ?? frequency;
}

function circleAttention(circle: HomeCircle): {
  label: string;
  className: string;
  kind: "alert" | "clock";
} | null {
  if (circle.urgent) {
    return {
      label: "Contribution needs attention",
      className: "bg-[#F3E1E0] text-[#8A2A21]",
      kind: "alert",
    };
  }
  if (circle.payoutNote) {
    return {
      label: circle.payoutNote,
      className: "bg-[#F3E1E0] text-[#8A2A21]",
      kind: "alert",
    };
  }
  if (circle.awaitingSchedule) {
    return {
      label: "Schedule pending",
      className: "bg-[#F8EDD9] text-[#8A5F14]",
      kind: "clock",
    };
  }
  return null;
}
