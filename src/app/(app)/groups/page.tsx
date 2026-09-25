import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, Add01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";
import { getHomeSnapshot, type HomeCircle } from "@/lib/home";
import { RevealLi } from "../../Reveal";

export const metadata = { title: "Circles" };

// Same explicit states as the home circle card and the detail header.
// Paused is danger-tinted (halted), never the forming amber — the four
// states must scan distinct at a glance.
const STATUS_LABEL: Record<string, string> = {
  forming: "Forming",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

const STATUS_BADGE: Record<string, string> = {
  forming: "bg-[#F8EDD9] text-[#8A5F14]",
  active: "bg-[#E0ECE9] text-primary",
  paused: "bg-[#F3E1E0] text-[#8A2A21]",
  completed: "bg-black/[0.04] text-text-secondary",
};

// One mark everywhere, tinted by state: circles stop feeling generic
// without leaving the token palette (no custom artwork, no new hues).
const IDENTITY_WASH: Record<string, string> = {
  forming: "bg-[#F8EDD9] text-[#8A5F14]",
  active: "bg-primary/10 text-primary",
  paused: "bg-[#F3E1E0] text-[#8A2A21]",
  completed: "bg-black/[0.04] text-text-secondary",
};

// Directory order, not home's urgency rank: live circles first,
// history last, alphabetical within a state.
const STATUS_RANK: Record<string, number> = {
  active: 0,
  forming: 1,
  paused: 2,
  completed: 3,
};

// "2 total · 1 active · 1 forming" — the total first so the line reads
// naturally, then only the states the member actually has.
function countLine(circles: HomeCircle[]): string | null {
  if (circles.length === 0) return null;
  const counts = new Map<string, number>();
  for (const circle of circles) {
    counts.set(circle.status, (counts.get(circle.status) ?? 0) + 1);
  }
  const parts = ["active", "forming", "paused", "completed"]
    .filter((status) => (counts.get(status) ?? 0) > 0)
    .map((status) => `${counts.get(status)} ${status}`);
  return [`${circles.length} total`, ...parts].join(" · ");
}

// Where am I in it. "Your turn" is the ajo word for it: a bare count reads
// as circle progress, but this number is the member's own place in the
// rotation — "you collect first" for 1 of 2.
// Null while unscheduled: the footer already carries "N members joined",
// so a member line here would just repeat it.
function memberLine(circle: HomeCircle): string | null {
  if (circle.awaitingSchedule) return null;
  const members = `${circle.memberCount} member${circle.memberCount === 1 ? "" : "s"}`;
  if (circle.myRoundNumber !== null) {
    return `${members} · Your turn: ${circle.myRoundNumber} of ${circle.rotationTotal}`;
  }
  if (circle.rotationTotal > 0) {
    return `${members} · ${circle.rotationTotal} turns`;
  }
  return members;
}

// What happens next — mine first (payout, then my due), then the
// circle-level state for turns that concern someone else.
function nextEvent(circle: HomeCircle): { text: string; emphasis: boolean } {
  if (circle.status === "paused") {
    return { text: "Paused. Contributions halted", emphasis: false };
  }
  if (circle.status === "completed") {
    return { text: "Rotation complete", emphasis: false };
  }
  if (circle.awaitingSchedule) {
    // State-sensitive: an unscheduled circle has no payout stage yet, so the
    // payout/due branches below must not run for it even when the snapshot
    // carries turn fields. No fixed target size exists, so "N more" would
    // be invented — the joined count is the informative part.
    const members = `${circle.memberCount} member${circle.memberCount === 1 ? "" : "s"}`;
    return { text: `${members} joined · Waiting to start`, emphasis: false };
  }
  // Mirrors the home card footer exactly: the payout line falls back to the
  // member's share amount when no pending payout row names the turn yet —
  // requiring a pending row here is what once printed "No contributions due
  // yet" on a circle home already showed a payout for. Turn-qualified when it
  // is not the current turn, so a Turn 2 payout never reads as collecting now
  // while Turn 1 is still blocked.
  if (circle.myPayoutDateLabel) {
    const mineNow = circle.isMyTurnNow;
    const turnSuffix =
      !mineNow && circle.myRoundNumber !== null
        ? ` Turn ${circle.myRoundNumber}`
        : "";
    return {
      text: `Your payout${turnSuffix} · ${circle.myPayoutLabel ?? circle.amountLabel} · ${circle.myPayoutDateLabel}`,
      emphasis: true,
    };
  }
  if (circle.myPayoutLabel) {
    const mineNow = circle.isMyTurnNow;
    const turnSuffix =
      !mineNow && circle.myRoundNumber !== null
        ? ` Turn ${circle.myRoundNumber}`
        : "";
    return {
      text: `Your payout${turnSuffix} · ${circle.myPayoutLabel}`,
      emphasis: true,
    };
  }
  if (circle.nextDueLabel) {
    return {
      text: `Next contribution ${circle.nextDueLabel} · ${circle.amountLabel}`,
      emphasis: false,
    };
  }
  if (circle.payoutNote) {
    return { text: circle.payoutNote, emphasis: false };
  }
  return { text: "No contributions due yet", emphasis: false };
}

export default async function GroupsPage() {
  const supabase = await createClient();
  // The full HomeCircle model (R1-aware dues, payout resolution, relative
  // dates) rather than a second derivation that could disagree with home.
  let snapshot;
  try {
    snapshot = await getHomeSnapshot(supabase, {
      circleLimit: Number.POSITIVE_INFINITY,
    });
  } catch (err) {
    console.error("circles directory failed", err);
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
          Could not load your circles
        </h1>
        <p className="max-w-xs text-sm leading-6 text-text-secondary">
          Something went wrong reading your circles. Refresh to try again.
        </p>
      </main>
    );
  }

  const circles = [...snapshot.circles].sort((a, b) => {
    const byStatus =
      (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
    if (byStatus !== 0) return byStatus;
    return a.name.localeCompare(b.name);
  });

  if (circles.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-primary/10">
          <HugeiconsIcon
            icon={UserGroupIcon}
            size={26}
            className="text-primary"
          />
        </span>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
          No circles yet
        </h1>
        <p className="max-w-xs text-sm leading-6 text-text-secondary">
          Create one to get started. Once you join a circle, it will show
          up here.
        </p>
        <Link
          href="/groups/new"
          className="mt-2 inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
        >
          <HugeiconsIcon icon={Add01Icon} size={18} />
          Create a circle
        </Link>
      </main>
    );
  }

  const counts = countLine(circles);

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            Your circles
          </h1>
          {counts && (
            <p className="mt-1 text-xs text-text-secondary">{counts}</p>
          )}
        </div>
        <Link
          href="/groups/new"
          aria-label="Create a circle"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover"
        >
          <HugeiconsIcon icon={Add01Icon} size={20} />
        </Link>
      </div>
      <ul className="flex flex-col gap-4">
        {circles.map((circle, i) => {
          const event = nextEvent(circle);
          const members = memberLine(circle);
          return (
            <RevealLi
              key={circle.groupId}
              delay={Math.min(i * 0.05, 0.25)}
              className="rounded-[14px] border-[0.5px] border-border bg-surface transition-colors duration-150 hover:border-primary/25"
            >
              <Link href={circle.href} className="flex gap-4 px-5 py-4">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${IDENTITY_WASH[circle.status] ?? IDENTITY_WASH.active}`}
                >
                  <HugeiconsIcon icon={UserGroupIcon} size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="truncate font-display text-lg font-semibold capitalize tracking-tight text-text-primary">
                      {circle.name}
                    </h2>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[circle.status] ?? STATUS_BADGE.active}`}
                    >
                      {STATUS_LABEL[circle.status] ?? circle.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm">
                    <span className="font-display font-semibold tabular-nums text-text-primary">
                      {circle.amountLabel}
                    </span>{" "}
                    <span className="text-text-secondary">
                      {circle.frequency}
                    </span>
                  </p>
                  {members && (
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {members}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                    <p
                      className={`min-w-0 truncate text-[13px] ${event.emphasis ? "font-semibold text-text-primary" : "text-text-secondary"}`}
                    >
                      {event.text}
                    </p>
                    <span className="shrink-0 text-[13px] font-semibold text-primary">
                      View <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            </RevealLi>
          );
        })}
      </ul>
    </main>
  );
}
