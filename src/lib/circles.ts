// Circle directory presentation logic: sorting, counts, and the per-row
// copy derivations. Pure functions over HomeCircle — no fetching, no JSX.
import { STATUS_RANK, TIMEZONE_TO_CURRENCY } from "@/constants/circle";
import type { HomeCircle } from "@/lib/home";
import type { Currency } from "@/types/circle";
import { collectTurnLabel } from "./rotation";

export function guessCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return TIMEZONE_TO_CURRENCY[tz] ?? "NGN";
  } catch {
    return "NGN";
  }
}

export function sortCircles(circles: HomeCircle[]): HomeCircle[] {
  return [...circles].sort((a, b) => {
    const byStatus =
      (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
    if (byStatus !== 0) return byStatus;
    return a.name.localeCompare(b.name);
  });
}

// "2 total · 1 active · 1 forming" — the total first so the line reads
// naturally, then only the states the member actually has.
export function countLine(circles: HomeCircle[]): string | null {
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

// Where am I in it. The position line names my own turn; the member count
// beside it is a different number — `rotationTotal` is scheduled turns,
// `memberCount` is the active roster — so both stay.
// Null while unscheduled: the footer already carries "N members joined",
// so a member line here would just repeat it.
export function memberLine(circle: HomeCircle): string | null {
  if (circle.awaitingSchedule) return null;
  const members = `${circle.memberCount} member${circle.memberCount === 1 ? "" : "s"}`;
  const position = collectTurnLabel(
    circle.myRoundNumber,
    circle.currentTurnNumber,
  );
  if (position) {
    return `${members} · ${position}`;
  }
  if (circle.rotationTotal > 0) {
    return `${members} · ${circle.rotationTotal} turns`;
  }
  return members;
}

// What happens next — mine first (payout, then my due), then the
// circle-level state for turns that concern someone else.
export function nextEvent(circle: HomeCircle): {
  text: string;
  emphasis: boolean;
} {
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
