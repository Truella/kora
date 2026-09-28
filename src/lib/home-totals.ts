// Home snapshot phase 3: lifetime/month totals + payment reliability.
// Pure derivation over the fetch bundle — no queries.
import {
  formatMoney,
  localParts,
} from "./money";
import type {
  HomePaymentProgress,
  HomeRawBundle,
  HomeTotals,
  SettledContribution,
  TotalsContext,
} from "@/types/home";

export function buildTotalsContext(bundle: HomeRawBundle): TotalsContext {
  const { userId, offset, today, month, groups, groupById, cycleById } = bundle;

  const contributed = new Map<string, number>();
  const received = new Map<string, number>();
  // Each circle's saved figure used to be its own filter over the entire
  // contributions table. It falls out of the same pass as the lifetime total —
  // same rows, same group lookup, one scan instead of one scan per group.
  const savedByGroup = new Map<string, number>();
  // Rows that resolved to a real cycle and group, carried through to the
  // activity feed so it does not repeat the lookups.
  const mySettled: SettledContribution[] = [];
  let monthAmount = 0;
  let monthCount = 0;

  // Settled money is history: it counts whatever the dates say. The R1 rule is
  // about what you are billed for, never about erasing a payment — and the
  // query already restricted this set to paid|late.
  for (const c of bundle.myContributions) {
    const cycle = cycleById.get(c.cycle_id);
    if (!cycle) continue;
    const group = groupById.get(cycle.group_id);
    if (!group) continue;
    const amount = Number(c.amount);
    contributed.set(
      group.currency,
      (contributed.get(group.currency) ?? 0) + amount,
    );
    savedByGroup.set(group.id, (savedByGroup.get(group.id) ?? 0) + amount);
    mySettled.push({ contribution: c, cycle, group });
    if (c.paid_at) {
      const at = localParts(c.paid_at, offset);
      if (at.y === today.y && at.m === today.m) {
        monthAmount += amount;
        monthCount += 1;
      }
    }
  }

  // The same settled rows that feed the money totals also answer the member's
  // reliability question. No extra query: `late` is settled history too, so the
  // denominator is every payment they have made and the numerator is the subset
  // that landed on time.
  const settledCount = bundle.myContributions.length;
  const onTimeCount = bundle.myContributions.filter(
    (c) => c.status === "paid",
  ).length;
  const lateCount = settledCount - onTimeCount;
  const paymentProgress: HomePaymentProgress = {
    settledCount,
    onTimeCount,
    lateCount,
    percent:
      settledCount > 0 ? Math.round((onTimeCount / settledCount) * 100) : 0,
  };

  const myMemberIds = new Set<string>();
  for (const m of bundle.members) {
    if (m.user_id === userId) myMemberIds.add(m.id);
  }
  for (const p of bundle.payouts) {
    if (p.status !== "completed" || !myMemberIds.has(p.recipient_member_id)) {
      continue;
    }
    const cycle = cycleById.get(p.cycle_id);
    if (!cycle) continue;
    const group = groupById.get(cycle.group_id);
    if (!group) continue;
    received.set(
      group.currency,
      (received.get(group.currency) ?? 0) + Number(p.amount),
    );
  }

  const circlesPerCurrency = new Map<string, Set<string>>();
  for (const g of groups) {
    const set = circlesPerCurrency.get(g.currency) ?? new Set<string>();
    set.add(g.id);
    circlesPerCurrency.set(g.currency, set);
  }

  // One currency owns the whole card — the most circles, ties broken by the
  // largest contributed total. A card reading ₦185,000 directly above
  // GH₵2,000 with no relationship is not one statement.
  const currencies = [...new Set(groups.map((g) => g.currency))];
  const primary =
    [...currencies].sort((a, b) => {
      const byCircles =
        (circlesPerCurrency.get(b)?.size ?? 0) -
        (circlesPerCurrency.get(a)?.size ?? 0);
      if (byCircles !== 0) return byCircles;
      return (contributed.get(b) ?? 0) - (contributed.get(a) ?? 0);
    })[0] ?? "NGN";

  const contributedAmount = contributed.get(primary) ?? 0;
  const receivedAmount = received.get(primary) ?? 0;
  const totals: HomeTotals = {
    contributed: {
      currency: primary,
      label: formatMoney(contributedAmount, primary),
      amount: contributedAmount,
    },
    // Hidden until it is non-zero: a permanent ₦0 beside a growing figure
    // teaches nothing and takes up the card.
    received:
      receivedAmount > 0
        ? {
            currency: primary,
            label: formatMoney(receivedAmount, primary),
            amount: receivedAmount,
          }
        : null,
    month: {
      currency: primary,
      label: formatMoney(monthAmount, primary),
      amount: monthAmount,
    },
    monthCount,
    monthName: month,
    others: currencies
      .filter((c) => c !== primary && (contributed.get(c) ?? 0) > 0)
      .map((c) => ({
        currency: c,
        label: formatMoney(contributed.get(c) ?? 0, c),
        amount: contributed.get(c) ?? 0,
        circleCount: circlesPerCurrency.get(c)?.size ?? 0,
      })),
    // Every figure at zero means the card teaches nothing — drop it.
    hasAny: contributedAmount > 0 || receivedAmount > 0 || monthAmount > 0,
  };

  return { totals, paymentProgress, savedByGroup, mySettled };
}
