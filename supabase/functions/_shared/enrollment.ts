// R1 — the retroactive-contribution boundary, in one place.
//
// generate-schedule's sync mode schedules only *unscheduled recipients*,
// appending after the highest existing cycle number, and it creates no
// contribution rows at all. So a member approved into an in-flight rotation
// used to read as owing every round that had already run: the circle page
// offered a Pay button for cycles that were already disbursed, and the payout
// gate counted them as expected, permanently blocking settlement.
//
// The rule everywhere: a member owes a cycle only if the cycle came due on or
// after the day they became an active member. It governs *billing* only — a
// settled payment is history and always counts, however late it was made.
//
// Three call sites must agree, or the data contradicts itself:
//   - src/lib/home.ts                (attention queue, progress denominator)
//   - src/app/(app)/groups/[id]/page.tsx  (Pay buttons, reminder banners)
//   - supabase/functions/process-payout/index.ts  (the disbursement gate)
//
// Both sides reduce to a `YYYY-MM-DD` string, so ISO ordering is a correct
// date comparison. The joined_at side is the UTC calendar date on purpose:
// this function has no way to read a member's per-country UTC offset, and a
// one-day disagreement with the app would make a member "expected" for a cycle
// the app says they do not owe — a gate that can then only ever 409.

/**
 * Was this member enrolled when the cycle came due?
 *
 * Fails CLOSED: anything that is not a readable ISO date counts as enrolled.
 * The alternative — reading an unreadable value as "joined after this cycle" —
 * would silently drop a member from the expected count and let money disburse
 * without their share. Over-strict only ever produces a 409 an organizer can
 * investigate; under-strict moves money that should not move.
 * group_members.joined_at is NOT NULL DEFAULT now(), so that branch is
 * defence in depth rather than an expected path.
 */
export function wasEnrolled(joinedAt: string, dueDate: string): boolean {
  const joined = /^\d{4}-\d{2}-\d{2}/.test(joinedAt)
    ? joinedAt.slice(0, 10)
    : null;
  if (joined === null) return true;
  return joined <= dueDate;
}
