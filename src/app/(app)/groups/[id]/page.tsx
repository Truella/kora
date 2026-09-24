import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";
import PayButton from "./PayButton";
import PayoutAction from "./PayoutAction";
import ConfirmingBanner from "./ConfirmingBanner";
import InviteButton from "./InviteButton";
import VoteButtons from "./VoteButtons";
import ScheduleGenerator from "./ScheduleGenerator";
import { RevealLi } from "../../../Reveal";
import LedgerFeed from "../../activity/LedgerFeed";
import { getLedgerEvents } from "@/lib/ledger";

export const metadata = { title: "Circle" };

const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  GHS: "GH₵",
  KES: "KSh",
  UGX: "USh",
};

const BADGE: Record<string, string> = {
  pending: "bg-[#F8EDD9] text-[#8A5F14]",
  paid: "bg-[#E0ECE9] text-[#1E5A4E]",
  late: "bg-[#F3E1E0] text-[#8A2A21]",
  completed: "bg-[#E0ECE9] text-[#1E5A4E]",
  failed: "bg-[#F3E1E0] text-[#8A2A21]",
};

// Reminder windows, computed once per render outside the component body
// so the purity lint stays quiet — values are plain date strings.
function dueWindows(): { today: string; soonCutoff: string } {
  const today = new Date().toISOString().slice(0, 10);
  const soonCutoff = new Date(Date.now() + 3 * 86400000)
    .toISOString()
    .slice(0, 10);
  return { today, soonCutoff };
}

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid } = await searchParams;
  const confirming = paid === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS ("view groups you belong to") returns a row only for members —
  // a missing row means not-found or not-a-member, same UI either way.
  const { data: group } = await supabase
    .from("groups")
    .select(
      "id, name, description, contribution_amount, currency, frequency, status, created_by",
    )
    .eq("id", id)
    .maybeSingle();

  if (!group) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
          Circle not found
        </h1>
        <p className="max-w-xs text-sm leading-6 text-text-secondary">
          It may not exist, or you are not a member of it.
        </p>
        <Link
          href="/groups"
          className="mt-2 rounded-[10px] bg-primary px-5 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Back to circles
        </Link>
      </main>
    );
  }

  const symbol = SYMBOLS[group.currency] ?? group.currency;
  const amountLabel = `${symbol}${Number(group.contribution_amount).toLocaleString()}`;

  const { data: member } = user
    ? await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };

  const { data: cycles } = await supabase
    .from("cycles")
    .select("id, cycle_number, due_date, status, recipient_member_id")
    .eq("group_id", id)
    .order("cycle_number", { ascending: true });

  const { data: contributions } = member
    ? await supabase
        .from("contributions")
        .select("id, cycle_id, status, paid_at")
        .eq("member_id", member.id)
    : { data: [] };

  const byCycle = new Map(
    (contributions ?? []).map((c) => [c.cycle_id, c]),
  );

  // Payout rows (schedule amounts + disbursement state) + recipient names
  // for the rotation view. Same shared-group profile resolution as the
  // ledger. Status drives the PayoutAction disbursement button.
  const { data: payouts } =
    member && cycles && cycles.length > 0
      ? await supabase
          .from("payouts")
          .select("cycle_id, amount, recipient_member_id, status")
          .in(
            "cycle_id",
            cycles.map((c) => c.id),
          )
      : { data: [] };
  const payoutByCycle = new Map(
    (payouts ?? []).map((p) => [p.cycle_id, p]),
  );

  const recipientIds = [
    ...new Set((cycles ?? []).map((c) => c.recipient_member_id)),
  ];
  let recipientNames = new Map<string, string>();
  if (member && recipientIds.length > 0) {
    const { data: rmembers } = await supabase
      .from("group_members")
      .select("id, user_id")
      .in("id", recipientIds);
    const rrows = (rmembers ?? []) as { id: string; user_id: string }[];
    const userIds = [...new Set(rrows.map((m) => m.user_id))];
    if (userIds.length > 0) {
      const { data: rprofs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      const byUser = new Map(
        ((rprofs ?? []) as { id: string; full_name: string }[]).map((p) => [
          p.id,
          p.full_name,
        ]),
      );
      recipientNames = new Map(
        rrows.map((m) => [
          m.id,
          byUser.get(m.user_id) ?? `····${m.user_id.slice(-4)}`,
        ]),
      );
    }
  }
  const potFor = (cycleId: string): string | null => {
    const row = payoutByCycle.get(cycleId);
    if (!row) return null;
    return `${symbol}${Number(row.amount).toLocaleString()}`;
  };

  // Active member count — feeds the generator card pre-schedule and the
  // creator's sync affordance once the rotation exists.
  const { count: activeCount } = member
    ? await supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", id)
        .eq("status", "active")
    : { count: null };
  const scheduledCount = new Set(
    (cycles ?? []).map((c) => c.recipient_member_id),
  ).size;
  const showSync =
    !!member &&
    !!user &&
    group.created_by === user.id &&
    !!cycles &&
    cycles.length > 0 &&
    (activeCount ?? 0) > scheduledCount;

  // In-app reminders: computed from already-fetched rows, no new queries.
  // A contribution row only exists once Pay starts, so "no row" counts as
  // unpaid — the nudge must fire before the first payment too. Late rows
  // are settled money (the webhook wrote them on verified payment), so
  // they leave the nudge lists alone.
  const isCreator = !!user && group.created_by === user.id;
  const { today, soonCutoff } = dueWindows();
  const unpaidCycles = (cycles ?? []).filter((c) => {
    const mine = byCycle.get(c.id) as { status?: string } | undefined;
    return !mine || (mine.status !== "paid" && mine.status !== "late");
  });
  const overdue = unpaidCycles.filter((c) => c.due_date < today);
  const dueSoon =
    overdue.length === 0
      ? unpaidCycles.filter((c) => c.due_date <= soonCutoff)
      : [];

  // Pending join requests + their votes. Visible to members only via
  // RLS; status flips come from the tally_join_votes trigger, never
  // from the client.
  const { data: requests } = member
    ? await supabase
        .from("join_requests")
        .select("id, applicant_id, created_at")
        .eq("group_id", id)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
    : { data: [] };

  const { data: votes } =
    member && requests && requests.length > 0
      ? await supabase
          .from("join_votes")
          .select("join_request_id, vote")
          .in(
            "join_request_id",
            requests.map((r) => r.id),
          )
      : { data: [] };

  const tally = new Map<string, { approve: number; reject: number }>();
  for (const v of votes ?? []) {
    const t = tally.get(v.join_request_id) ?? { approve: 0, reject: 0 };
    if (v.vote === "approve") t.approve += 1;
    else t.reject += 1;
    tally.set(v.join_request_id, t);
  }

  // Circle-scoped ledger for the "Recent activity" strip — same shared
  // feed component as /activity, filtered to this group.
  const ledger = member
    ? await getLedgerEvents(supabase, id)
    : { due: [], history: [] };

  // Members with trust + inviter labels (Day 5A). Read-only: RLS
  // "view members of your groups" scopes to fellow members; profiles
  // resolve via the shared-group policy with a masked fallback.
  type CircleMemberRow = {
    id: string;
    user_id: string;
    invited_by: string | null;
    trust_score_cache: number | string;
    payout_position: number | null;
  };
  const { data: circleMembers } = member
    ? await supabase
        .from("group_members")
        .select("id, user_id, invited_by, trust_score_cache, payout_position")
        .eq("group_id", id)
        .eq("status", "active")
        .order("payout_position", { ascending: true })
    : { data: [] };
  const circleRows = (circleMembers ?? []) as CircleMemberRow[];
  // invited_by references profiles(id), so one profile map covers both
  // member names and inviter names.
  let profileNames = new Map<string, string>();
  if (member && circleRows.length > 0) {
    const needIds = [
      ...new Set([
        ...circleRows.map((m) => m.user_id),
        ...circleRows
          .map((m) => m.invited_by)
          .filter((v): v is string => v !== null),
      ]),
    ];
    const { data: mprofs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", needIds);
    profileNames = new Map(
      ((mprofs ?? []) as { id: string; full_name: string }[]).map((p) => [
        p.id,
        p.full_name,
      ]),
    );
  }

  // Trust breakdown: per-member on-time vs late counts behind the cached
  // score. Contributions are member-readable via RLS; only settled rows
  // (paid/late) count — pendings and missing rows are not trust events.
  const trustBreakdown = new Map<string, { onTime: number; late: number }>();
  if (member && circleRows.length > 0 && cycles && cycles.length > 0) {
    const { data: settledRows } = await supabase
      .from("contributions")
      .select("member_id, status")
      .in(
        "cycle_id",
        cycles.map((c) => c.id),
      )
      .in("status", ["paid", "late"]);
    for (const row of (settledRows ?? []) as {
      member_id: string;
      status: string;
    }[]) {
      const t = trustBreakdown.get(row.member_id) ?? { onTime: 0, late: 0 };
      if (row.status === "late") t.late += 1;
      else t.onTime += 1;
      trustBreakdown.set(row.member_id, t);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      {confirming && <ConfirmingBanner groupId={group.id} />}

      {member && overdue.length > 0 && (
        <div className="rounded-[10px] bg-[#F3E1E0] px-4 py-3 text-sm text-[#8A2A21]">
          {overdue.length} contribution{overdue.length === 1 ? "" : "s"}{""}
          overdue — Cycle {overdue[0].cycle_number} was due{""}
          {overdue[0].due_date}. Pay now to protect your trust score.
        </div>
      )}
      {member && dueSoon.length > 0 && (
        <div className="rounded-[10px] bg-[#F8EDD9] px-4 py-3 text-sm text-[#8A5F14]">
          {amountLabel} {group.currency} due {dueSoon[0].due_date} (Cycle{""}
          {dueSoon[0].cycle_number})
          {dueSoon.length > 1
            ? ` — plus ${dueSoon.length - 1} more within 3 days`
            : ""}
          .
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary/10">
          <HugeiconsIcon
            icon={UserGroupIcon}
            size={20}
            className="text-primary"
          />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            {group.name}
          </h1>
          <p className="font-display text-xs font-semibold tabular-nums text-text-secondary">
            {amountLabel} {group.currency} · {group.frequency} · {group.status}
          </p>
        </div>
        {member && <InviteButton groupId={group.id} memberId={member.id} />}
      </div>

      {!cycles || cycles.length === 0 ? (        member && isCreator ? (
          <ScheduleGenerator
            groupId={group.id}
            frequency={group.frequency}
            memberCount={activeCount ?? 1}
          />
        ) : (
          <div className="rounded-[14px] border-[0.5px] border-border bg-surface p-5 text-center">
            <p className="font-display text-lg font-semibold text-text-primary">
              Waiting for schedule
            </p>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              The payout rotation has not been generated yet — the organizer
              starts it once membership settles.
            </p>
          </div>
        )
      ) : (
        <>
          <p className="text-sm leading-6 text-text-secondary">
            How it works: every member pays their own share each round — the
            combined pot goes to the named receiver. You always pay your
            share, even on another member&apos;s turn.
          </p>
          <ul className="flex flex-col gap-3">
          {cycles.map((cycle, i) => {            const contribution = byCycle.get(cycle.id);
            const status = contribution?.status ?? "pending";
            const isPaid = status === "paid";
            // Late is settled money (webhook-verified, just past due) —
            // no second Pay button, terminal copy instead.
            const isSettled = isPaid || status === "late";
            const recipient =
              recipientNames.get(cycle.recipient_member_id) ?? null;
            const pot = potFor(cycle.id);
            const payout = payoutByCycle.get(cycle.id) as
              | { status?: string }
              | undefined;
            const payoutStatus = payout?.status ?? "pending";
            return (
              <RevealLi
                key={cycle.id}
                delay={Math.min(i * 0.05, 0.25)}
                className="flex flex-col gap-3 rounded-[14px] border-[0.5px] border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-text-primary">
                      Cycle {cycle.cycle_number}
                    </p>
                    <p className="font-display text-xs font-semibold tabular-nums text-text-secondary">
                      {amountLabel} your share · due {cycle.due_date} ·{""}
                      {cycle.status}
                      {contribution?.paid_at
                        ? ` · paid ${new Date(contribution.paid_at).toLocaleDateString()}`
                        : ""}
                    </p>
                    {(recipient || pot) && (
                      <p className="font-display text-xs font-semibold tabular-nums text-text-secondary">
                        {pot ? `Pot ${pot}` : "Pot"}
                        {recipient
                          ? ` → ${recipient}'s turn to receive`
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                      Your share
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${BADGE[status] ?? BADGE.pending}`}
                    >
                      {status}
                    </span>
                  </div>
                </div>
                {member && !isSettled && (
                  <PayButton
                    cycleId={cycle.id}
                    groupId={group.id}
                    amountLabel={amountLabel}
                  />
                )}
                {isPaid && (
                  <p className="text-xs text-text-secondary">
                    Paid — receipt confirmed by webhook.
                  </p>
                )}
                {status === "late" && (
                  <p className="text-xs font-medium text-danger">
                    Paid late — the money arrived after the due date, so
                    trust took a hit.
                  </p>
                )}
                {member && (
                  <div className="flex flex-col gap-2 border-t border-border pt-3">
                    <p className="font-mono text-xs text-text-secondary">
                      Payout ·{""}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${BADGE[payoutStatus] ?? BADGE.pending}`}
                      >
                        {payoutStatus}
                      </span>
                    </p>
                    <PayoutAction
                      cycleId={cycle.id}
                      payoutStatus={payoutStatus}
                    />
                  </div>
                )}
              </RevealLi>
            );
          })}
          </ul>
        </>
      )}

      {showSync && (
        <ScheduleGenerator
          groupId={group.id}
          frequency={group.frequency}
          memberCount={activeCount ?? scheduledCount}
          mode="sync"
          newCount={(activeCount ?? scheduledCount) - scheduledCount}
        />
      )}

      {member && circleRows.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Members
          </h2>
          <ul className="flex flex-col gap-2">
            {circleRows.map((m, i) => {
              const name =
                profileNames.get(m.user_id) ?? `····${m.user_id.slice(-4)}`;
              const isFounder = m.user_id === group.created_by;
              const isYou = !!user && m.user_id === user.id;
              const inviter = m.invited_by
                ? profileNames.get(m.invited_by)
                : null;
              const sub = isFounder
                ? "Founder"
                : m.invited_by
                  ? `Invited by ${inviter ?? "a member"}`
                  : "Joined via link";
              const score = Number(m.trust_score_cache);
              const record = trustBreakdown.get(m.id);
              const settledTotal =
                (record?.onTime ?? 0) + (record?.late ?? 0);
              const recordDetail =
                settledTotal === 0
                  ? "No payments yet"
                  : `${record?.onTime ?? 0} on-time · ${record?.late ?? 0} late`;
              return (
                <RevealLi
                  key={m.id}
                  delay={Math.min(i * 0.05, 0.2)}
                  className="flex items-center justify-between gap-3 rounded-[10px] border-[0.5px] border-border bg-surface p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {name}
                      {isYou ? (
                        <span className="font-normal text-text-secondary">
                          {""}
                          · You
                        </span>
                      ) : (
                        ""
                      )}
                    </p>
                    <p className="font-mono text-xs text-text-secondary">{sub}</p>
                    <p className="font-mono text-xs text-text-secondary">
                      {recordDetail}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#F3EDDF] px-3 py-1 text-xs font-semibold text-[#7A6028]">
                    Trust {Number.isFinite(score) ? score : 100}
                  </span>
                </RevealLi>
              );
            })}
          </ul>
          <p className="text-xs leading-5 text-text-secondary">
            Scores start at 100 for everyone and move with on-time payments —
            the counts underneath show what each score is built from.
          </p>
        </section>
      )}

      {member && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Recent activity
          </h2>
          <LedgerFeed
            initialDue={ledger.due}
            initialHistory={ledger.history}
            groupId={id}
            previewCount={5}
          />
        </section>
      )}

      {member && requests && requests.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Pending requests
          </h2>
          <ul className="flex flex-col gap-3">
            {requests.map((request) => {
              const t = tally.get(request.id) ?? { approve: 0, reject: 0 };
              return (
                <li
                  key={request.id}
                  className="flex flex-col gap-3 rounded-[14px] border-[0.5px] border-border bg-surface p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-text-primary">
                      Applicant{""}
                      <span className="font-mono text-xs text-text-secondary">
                        ····{request.applicant_id.slice(-4)}
                      </span>
                    </p>
                    <p className="font-mono text-xs tabular-nums text-text-secondary">
                      {t.approve} yes · {t.reject} no
                    </p>
                  </div>
                  <VoteButtons
                    joinRequestId={request.id}
                    memberId={member.id}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
