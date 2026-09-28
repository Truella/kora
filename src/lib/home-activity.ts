// Home snapshot phase 5: recent activity feed.
// Pure derivation over the fetch bundle + totals context — no queries.
import {
  formatMoney,
  settledDayLabel,
} from "./money";
import type {
  HomeActivity,
  HomeRawBundle,
  RankedActivity,
  TotalsContext,
} from "@/types/home";

export function buildRecentActivity(
  bundle: HomeRawBundle,
  totals: TotalsContext,
): HomeActivity[] {
  const { userId, offset, today, cycleById, groupById } = bundle;

  const myMemberIds = new Set<string>();
  for (const m of bundle.members) {
    if (m.user_id === userId) myMemberIds.add(m.id);
  }

  // Settled only. Everything still upcoming already lives in the attention
  // queue, and repeating it here would undo that separation.
  const activity: RankedActivity[] = [];
  for (const { contribution: c, cycle, group } of totals.mySettled) {
    if (!c.paid_at) continue;
    activity.push({
      id: `c:${c.id}`,
      tone: "paid",
      headline: "You contributed",
      amountLabel: formatMoney(c.amount, group.currency),
      groupName: group.name,
      dayLabel: settledDayLabel(c.paid_at, offset, today),
      contextLabel: `Turn ${cycle.cycle_number}`,
      sortKey: new Date(c.paid_at).getTime(),
    });
  }
  for (const p of bundle.payouts) {
    if (p.status !== "completed" || !p.paid_at) continue;
    const cycle = cycleById.get(p.cycle_id);
    if (!cycle) continue;
    const group = groupById.get(cycle.group_id);
    if (!group) continue;
    const mine = myMemberIds.has(p.recipient_member_id);
    activity.push({
      id: `p:${p.id}`,
      tone: mine ? "received" : "circle-payout",
      // A payouts row is a per-cycle disbursement for the whole circle, so
      // "received" is only true when the recipient is the caller.
      headline: mine ? "You received" : "Circle payout",
      amountLabel: formatMoney(p.amount, group.currency),
      groupName: group.name,
      dayLabel: settledDayLabel(p.paid_at, offset, today),
      contextLabel: `Turn ${cycle.cycle_number}`,
      sortKey: new Date(p.paid_at).getTime(),
    });
  }
  activity.sort((a, b) => b.sortKey - a.sortKey);
  return activity.slice(0, 5).map((item) => ({
    id: item.id,
    tone: item.tone,
    headline: item.headline,
    amountLabel: item.amountLabel,
    groupName: item.groupName,
    dayLabel: item.dayLabel,
    contextLabel: item.contextLabel,
  }));
}
