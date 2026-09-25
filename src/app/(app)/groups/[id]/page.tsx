import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";
import PayButton from "./PayButton";
import PayoutAction from "./PayoutAction";
import ConfirmingBanner from "./ConfirmingBanner";
import InviteMenu from "./InviteMenu";
import VoteButtons from "./VoteButtons";
import ScheduleGenerator from "./ScheduleGenerator";
import { RevealLi } from "../../../Reveal";
import LedgerFeed from "../../activity/LedgerFeed";
import { getLedgerEvents } from "@/lib/ledger";
import { utcDateOnly, formatCycleDate, formatCycleDateShort } from "@/lib/money";

export const metadata = { title: "Circle" };

const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  GHS: "GH₵",
  KES: "KSh",
  UGX: "USh",
};

// Explicit circle states, shared with the home card + circles list.
const STATUS_LABEL: Record<string, string> = {
  forming: "Forming",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

const STATUS_BADGE: Record<string, string> = {
  forming: "bg-[#F8EDD9] text-[#8A5F14]",
  active: "bg-[#E0ECE9] text-[#1E5A4E]",
  paused: "bg-[#F3E1E0] text-[#8A2A21]",
  completed: "bg-black/[0.04] text-text-secondary",
};

// Same state-tinted identity mark as the circles directory — one mark
// everywhere, no new hues.
const IDENTITY_WASH: Record<string, string> = {
  forming: "bg-[#F8EDD9] text-[#8A5F14]",
  active: "bg-primary/10 text-primary",
  paused: "bg-[#F3E1E0] text-[#8A2A21]",
  completed: "bg-black/[0.04] text-text-secondary",
};

// Anchors the /home attention queue deep-links to. The scroll margin keeps the
// sticky app header from covering the row it just scrolled to.
const ANCHOR_MT = "scroll-mt-[calc(var(--app-header-h)+1rem)]";

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
        .select("id, joined_at")
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
          .select("cycle_id, amount, recipient_member_id, status, paid_at")
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

  // Current turn = the first cycle still in flight, oldest first. All
  // settled → the hero shows the last one with a Settled state instead of
  // going empty. Everything before it is history, everything after is
  // upcoming. (Schema calls these rows "cycles"; the UI calls each slot a
  // turn and reserves "cycle" for a full rotation.)
  const sortedCycles = [...(cycles ?? [])].sort(
    (a, b) => a.cycle_number - b.cycle_number,
  );
  const currentCycle =
    sortedCycles.find((c) => c.status !== "completed") ??
    sortedCycles[sortedCycles.length - 1] ??
    null;
  const currentIdx = currentCycle
    ? sortedCycles.findIndex((c) => c.id === currentCycle.id)
    : -1;
  const pastCycles = currentCycle
    ? sortedCycles
        .filter((c) => c.cycle_number < currentCycle.cycle_number)
        .reverse()
    : [];
  const upcomingCycles = currentCycle
    ? sortedCycles.filter((c) => c.cycle_number > currentCycle.cycle_number)
    : [];
  const nextRecipientId =
    currentIdx >= 0 && currentIdx + 1 < sortedCycles.length
      ? sortedCycles[currentIdx + 1].recipient_member_id
      : null;

  // Per-member settlement for the current turn only — feeds the hero
  // progress bar and the members panel states. One RLS-covered select;
  // history rows show the caller's own share from byCycle instead.
  const { data: currentContributions } =
    member && currentCycle
      ? await supabase
          .from("contributions")
          .select("member_id, status")
          .eq("cycle_id", currentCycle.id)
      : { data: [] };
  const settledByMember = new Map(
    (
      (currentContributions ?? []) as {
        member_id: string;
        status: string;
      }[]
    ).map((r) => [r.member_id, r.status]),
  );
  const settledCount = [...settledByMember.values()].filter(
    (s) => s === "paid" || s === "late",
  ).length;

  // R1 — retroactive contribution bug. generate-schedule's sync mode appends a
  // late joiner's recipient slot at the end of the rotation and never
  // backfills the rounds that already ran, and it creates no contribution
  // rows at all. So "no row" used to mean unpaid for every cycle in the
  // group, and this page offered a Pay button for rounds that finished —
  // and were already disbursed — before the member arrived.
  //
  // A member owes a cycle only if its due date falls on or after the day they
  // became an active member. This governs billing only: a settled payment is
  // history and still counts, however late it was made. /home applies the
  // same rule to its attention queue and progress bar, and process-payout to
  // its settle check — all three have to agree or the data contradicts itself.
  //
  // utcDateOnly rather than the member's own offset: process-payout decides
  // this same boundary from the stored timestamptz and has no way to read each
  // member's auth metadata, so a one-day disagreement there would make a
  // member "expected" for a cycle this page says they do not owe — a gate
  // that would 409 forever.
  const memberRow = member as { id: string; joined_at?: string } | null;
  const joinedAt = memberRow?.joined_at ?? null;
  const joinedDate = joinedAt ? utcDateOnly(joinedAt) : null;
  const enrolledIn = (c: { due_date: string }) =>
    !joinedDate || c.due_date >= joinedDate;

  const isCreator = !!user && group.created_by === user.id;
  const { today, soonCutoff } = dueWindows();

  // In-app reminders: computed from already-fetched rows, no new queries.
  // A contribution row only exists once Pay starts, so "no row" counts as
  // unpaid — the nudge must fire before the first payment too. Late rows
  // are settled money (the webhook wrote them on verified payment), so
  // they leave the nudge lists alone.
  const unpaidCycles = (cycles ?? []).filter((c) => {
    if (!enrolledIn(c)) return false;
    const mine = byCycle.get(c.id) as { status?: string } | undefined;
    return !mine || (mine.status !== "paid" && mine.status !== "late");
  });
  const overdue = unpaidCycles.filter((c) => c.due_date < today);
  const dueSoon =
    overdue.length === 0
      ? unpaidCycles.filter((c) => c.due_date <= soonCutoff)
      : [];

  // Pending join requests + their votes. Names/phones arrive via the
  // pending_applicants() RPC: applicants are not members yet, so the
  // shared-group profiles policy hides them and only the RPC (scoped to
  // active members of this circle) reveals who is asking in. Status flips
  // come from the tally_join_votes trigger, never from the client.
  type ApplicantRow = {
    request_id: string;
    applicant_name: string | null;
    applicant_phone: string | null;
    inviter_name: string | null;
  };
  const { data: applicantRows } = member
    ? await supabase.rpc("pending_applicants", { p_group_id: id })
    : { data: [] };
  const requests = ((applicantRows ?? []) as ApplicantRow[]).map((r) => ({
    id: r.request_id,
    applicant_name: r.applicant_name,
    applicant_phone: r.applicant_phone,
    inviter_name: r.inviter_name,
  }));

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
    joined_at: string;
  };
  const { data: circleMembers } = member
    ? await supabase
        .from("group_members")
        .select(
          "id, user_id, invited_by, trust_score_cache, payout_position, joined_at",
        )
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

  // Trust scores arrive on the member rows (trust_score_cache); the panel
  // shows the number, no extra breakdown query needed at this scale.

  // "Your turn: X of Y" — the caller's own slot in the rotation, shown in
  // the hero header. Null positions hide the line rather than guessing.
  const myCircleRow = user
    ? circleRows.find((m) => m.user_id === user.id)
    : undefined;
  const myTurnPosition = myCircleRow?.payout_position ?? null;
  const rotationTotal = circleRows.length;

  // Which members have any settled share in this circle. A newcomer with no
  // settled share reads as "New" rather than a perfect 100 they haven't
  // earned — one RLS-covered select, no per-member queries.
  const { data: memberSettledRows } =
    member && circleRows.length > 0 && cycles && cycles.length > 0
      ? await supabase
          .from("contributions")
          .select("member_id")
          .in(
            "cycle_id",
            cycles.map((c) => c.id),
          )
          .in("status", ["paid", "late"])
      : { data: [] };
  const settledMemberIds = new Set(
    ((memberSettledRows ?? []) as { member_id: string }[]).map(
      (r) => r.member_id,
    ),
  );

  // How many shares a pot holds: pot ÷ share. Makes "₦5,700 vs ₦11,400"
  // legible as 1 share vs 2 shares instead of a math error.
  const sharesFor = (cycleId: string): number | null => {
    const row = payoutByCycle.get(cycleId) as
      | { amount?: number | string }
      | undefined;
    const share = Number(group.contribution_amount);
    if (!row || !share) return null;
    return Math.round(Number(row.amount) / share);
  };

  // Hero derivations for the current turn. R1 enrollment applies here too:
  // a turn that fell due before the caller joined is not theirs to pay.
  const myCurrentContribution = currentCycle
    ? byCycle.get(currentCycle.id)
    : undefined;
  const enrolledCurrent = currentCycle ? enrolledIn(currentCycle) : false;
  const myCurrentStatus = !currentCycle
    ? "pending"
    : enrolledCurrent
      ? myCurrentContribution?.status ?? "pending"
      : "skipped";
  const myCurrentSettled =
    myCurrentStatus === "paid" || myCurrentStatus === "late";
  const currentPayout = currentCycle
    ? (payoutByCycle.get(currentCycle.id) as
        | { status?: string; paid_at?: string | null }
        | undefined)
    : undefined;
  const currentPayoutStatus = currentPayout?.status ?? "pending";
  const currentRecipient = currentCycle
    ? (recipientNames.get(currentCycle.recipient_member_id) ?? null)
    : null;
  const currentPot = currentCycle ? potFor(currentCycle.id) : null;
  const isMyTurn =
    !!member && !!currentCycle && currentCycle.recipient_member_id === member.id;
  // Shares the payout gate actually waits on: active members enrolled on
  // or before the turn's due date — the same boundary process-payout
  // enforces. A late joiner never owed this turn, so counting them would
  // stall the button forever.
  const enrolledCount = currentCycle
    ? circleRows.filter(
        (m) => utcDateOnly(m.joined_at) <= currentCycle.due_date,
      ).length
    : 0;
  const expectedCount =
    enrolledCount > 0 ? enrolledCount : (activeCount ?? rotationTotal);
  // The confirm button only exists once the payout can actually complete.
  // Before that the row says what's missing instead of offering a dead tap.
  const payoutReady = expectedCount > 0 && settledCount >= expectedCount;
  const currentShares = currentCycle ? sharesFor(currentCycle.id) : null;
  const currentSharesLabel =
    currentShares !== null
      ? ` · ${currentShares} share${currentShares === 1 ? "" : "s"}`
      : "";

  // Members ride beside the hero on desktop, below it on mobile — and below
  // the waiting card pre-schedule (without per-turn states, which don't
  // exist yet). No "See all": circles are small, the full rotation fits.
  // Trust stays as the cached number; the on-time/late breakdown behind it
  // was cut from this surface.
  const membersPanel =
    member && circleRows.length > 0 ? (
      <section className="overflow-hidden rounded-[20px] border-[0.5px] border-border bg-surface">
        <div className="px-4 pb-1 pt-4">
          <h2 className="font-display text-base font-semibold tracking-tight text-text-primary">
            Members · {circleRows.length}
          </h2>
          <p className="mt-0.5 text-[11px] text-text-secondary">
            New members join by member vote
          </p>
        </div>
        <ul className="flex flex-col px-2 pb-2">
          {circleRows.map((m, i) => {
            const name =
              profileNames.get(m.user_id) ?? `····${m.user_id.slice(-4)}`;
            const isFounder = m.user_id === group.created_by;
            const isYou = !!user && m.user_id === user.id;
            const isNext = m.id === nextRecipientId;
            const inviter = m.invited_by
              ? profileNames.get(m.invited_by)
              : null;
            const role = isFounder
              ? "Founder"
              : m.invited_by
                ? `Invited by ${inviter ?? "a member"}`
                : "Joined via link";
            const turnState = currentCycle
              ? (settledByMember.get(m.id) ?? "pending")
              : null;
            // "Share …" on purpose: the Turn number beside it is the receive
            // slot, so a bare "Pending" would read ambiguously.
            const stateCopy =
              turnState === "paid"
                ? "Share paid"
                : turnState === "late"
                  ? "Share late"
                  : turnState
                    ? "Share pending"
                    : null;
            const avatarWash =
              turnState === "paid"
                ? "bg-[#E0ECE9] text-[#1E5A4E]"
                : turnState === "late"
                  ? "bg-[#F3E1E0] text-[#8A2A21]"
                  : turnState
                    ? "bg-[#F8EDD9] text-[#8A5F14]"
                    : "bg-black/[0.04] text-text-secondary";
            const score = Number(m.trust_score_cache);
            // No settled share yet → "New", not a perfect 100 unearned.
            const trustLabel = settledMemberIds.has(m.id)
              ? `Trust ${Number.isFinite(score) ? score : 100}`
              : "Trust · New";
            const pos = m.payout_position ?? i + 1;
            return (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-[12px] px-2 py-2"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${avatarWash}`}
                >
                  {(name.trim().charAt(0) || "·").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {name}
                    {isYou ? (
                      <span className="font-normal text-text-secondary">
                        {" "}
                        · You
                      </span>
                    ) : (
                      ""
                    )}
                    {isNext ? (
                      <span className="ml-1.5 rounded-full bg-[#F8EDD9] px-2 py-px text-[10px] font-semibold text-[#8A5F14]">
                        Next
                      </span>
                    ) : (
                      ""
                    )}
                  </p>
                  <p className="truncate font-mono text-[11px] text-text-secondary">
                    {role}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-[11px] tabular-nums text-text-secondary">
                    Turn {pos}
                  </p>
                  {stateCopy ? (
                    <p className="font-mono text-[11px] text-text-secondary">
                      {stateCopy}
                    </p>
                  ) : (
                    ""
                  )}
                  <p className="font-mono text-[11px] tabular-nums text-text-secondary">
                    {trustLabel}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    ) : null;

  // Compressed turn rows for history + upcoming: slot, pot, my share,
  // payout state. Keeps the `cycle-<id>` anchor so /home attention
  // deep-links land. Upcoming rows keep a compact Pay affordance — a share
  // can fall due while an earlier turn still awaits its payout, and the
  // hero only covers the current turn.
  const renderTurnRow = (
    cycle: (typeof sortedCycles)[number],
    kind: "past" | "upcoming",
  ) => {
    const contribution = byCycle.get(cycle.id);
    const enrolled = enrolledIn(cycle);
    const status = enrolled ? contribution?.status ?? "pending" : "skipped";
    const needsPay =
      !!member && enrolled && status !== "paid" && status !== "late";
    const payout = payoutByCycle.get(cycle.id) as
      | { status?: string }
      | undefined;
    const payoutStatus = payout?.status ?? "pending";
    const recipient = recipientNames.get(cycle.recipient_member_id) ?? null;
    const pot = potFor(cycle.id);
    const shares = sharesFor(cycle.id);
    const done = kind === "past";
    return (
      <RevealLi
        key={cycle.id}
        id={`cycle-${cycle.id}`}
        delay={0.05}
        className={`${ANCHOR_MT} flex flex-col gap-2 rounded-[14px] border-[0.5px] border-border bg-surface p-4`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-text-primary">
              Turn {cycle.cycle_number}
            </p>
            <p className="mt-0.5 text-xs tabular-nums leading-5 text-text-secondary">
              {pot
                ? `Pot ${pot}${shares !== null ? ` · ${shares} share${shares === 1 ? "" : "s"}` : ""} · `
                : ""}
              Due {formatCycleDate(cycle.due_date)}
              {recipient ? ` · ${recipient} receives` : ""}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${done ? "bg-[#E0ECE9] text-[#1E5A4E]" : "bg-[#F8EDD9] text-[#8A5F14]"}`}
          >
            {done ? "✓ Complete" : "Upcoming"}
          </span>
        </div>
        <div className="border-t border-border pt-2.5 text-xs leading-5 text-text-secondary">
          <p>
            {status === "skipped"
              ? "Not yours — ran before you joined"
              : status === "paid"
                ? "Your share ✓"
                : status === "late"
                  ? "Your share ✓ late"
                  : "Your share · Pending"}
            {" · "}
            {payoutStatus === "completed" ? "Payout ✓" : `Payout ${payoutStatus}`}
          </p>
        </div>
        {kind === "upcoming" && needsPay && (
          <PayButton
            cycleId={cycle.id}
            groupId={group.id}
            amountLabel={amountLabel}
            variant="compact"
          />
        )}
      </RevealLi>
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      {confirming && <ConfirmingBanner groupId={group.id} />}

      {member && overdue.length > 0 && (
        <div className="rounded-[10px] bg-[#F3E1E0] px-4 py-3 text-sm text-[#8A2A21]">
          {overdue.length} contribution{overdue.length === 1 ? "" : "s"}
          overdue — Turn {overdue[0].cycle_number} was due{" "}
          {formatCycleDate(overdue[0].due_date)}. Pay now to protect your
          trust score.
        </div>
      )}
      {member && dueSoon.length > 0 && (
        <div className="rounded-[10px] bg-[#F8EDD9] px-4 py-3 text-sm text-[#8A5F14]">
          {amountLabel} due {formatCycleDate(dueSoon[0].due_date)} (Turn{""}
          {dueSoon[0].cycle_number})
          {dueSoon.length > 1
            ? ` — plus ${dueSoon.length - 1} more within 3 days`
            : ""}
          .
        </div>
      )}

      <div>
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${IDENTITY_WASH[group.status] ?? IDENTITY_WASH.active}`}
          >
            <HugeiconsIcon icon={UserGroupIcon} size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-semibold capitalize tracking-tight text-text-primary">
              {group.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-display text-xs font-semibold tabular-nums text-text-secondary">
              {amountLabel} {group.frequency} ·{" "}
              {(activeCount ?? rotationTotal) === 1
                ? "1 member"
                : `${activeCount ?? rotationTotal} members`}
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[group.status] ?? STATUS_BADGE.active}`}
              >
                {STATUS_LABEL[group.status] ?? group.status}
              </span>
            </p>
          </div>
          {member && user && (
            <InviteMenu groupId={group.id} inviterId={user.id} />
          )}
        </div>
      </div>

      {!cycles || cycles.length === 0 ? (
        <>
          {member && isCreator ? (
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
          )}
          {membersPanel}
        </>
      ) : currentCycle ? (
        <>
          {/* Event cards: the card states what is, these say what needs you.
              Pay-my-share and confirm-my-payout live here — never as rows
              inside the turn card. */}
          {member &&
            currentCycle.status !== "completed" &&
            enrolledCurrent &&
            !myCurrentSettled && (
              <section className="flex flex-col gap-3 rounded-[20px] border-[0.5px] border-border bg-[#F8EDD9]/45 p-5">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#8A5F14]">
                    Your turn to pay
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold tracking-tight text-text-primary">
                    Your {amountLabel} share · Turn {currentCycle.cycle_number}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-text-secondary">
                    Due {formatCycleDate(currentCycle.due_date)} — pay now to
                    protect your trust score.
                  </p>
                </div>
                <PayButton
                  cycleId={currentCycle.id}
                  groupId={group.id}
                  amountLabel={amountLabel}
                />
              </section>
            )}
          {member &&
            currentPayoutStatus === "pending" &&
            payoutReady &&
            isMyTurn && (
              <section className="flex flex-col gap-3 rounded-[20px] border-[0.5px] border-border bg-[#E0ECE9]/45 p-5">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#1E5A4E]">
                    Your payout is ready
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold tracking-tight text-text-primary">
                    Pot {currentPot ?? amountLabel}
                    {currentSharesLabel} · Turn {currentCycle.cycle_number}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-text-secondary">
                    Every share is in — confirming releases the pot and
                    settles the turn.
                  </p>
                </div>
                <div className="flex justify-end">
                  <PayoutAction
                    cycleId={currentCycle.id}
                    payoutStatus={currentPayoutStatus}
                  />
                </div>
              </section>
            )}
          <div className="flex flex-col gap-4">
            <section
              id={`cycle-${currentCycle.id}`}
              className={`${ANCHOR_MT} relative overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_88%_8%,rgba(191,154,78,0.26),transparent_34%),linear-gradient(135deg,#0B2624_0%,#14524F_125%)] p-5 text-white shadow-[0_18px_42px_rgba(11,38,36,0.16)] sm:p-6`}
            >
              <div
                aria-hidden
                className="absolute -right-16 -top-20 h-52 w-52 rounded-full border border-white/10"
              />
              <div
                aria-hidden
                className="absolute -right-7 -top-10 h-32 w-32 rounded-full border border-white/10"
              />
              <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold tracking-tight text-white">
                  Turn {currentCycle.cycle_number}
                </h2>
                  {currentCycle.status === "completed" ? (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-[#E0ECE9] px-2.5 py-0.5 text-[11px] font-semibold text-[#1E5A4E]">
                      ✓ Settled
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-[#F8EDD9] px-2.5 py-0.5 text-[11px] font-semibold text-[#8A5F14]">
                      Due {formatCycleDate(currentCycle.due_date)}
                    </span>
                  )}
                </div>
                {myTurnPosition !== null && rotationTotal > 0 && (
                  <p className="mt-1 text-xs font-semibold tabular-nums text-white/65">
                    Your turn: {myTurnPosition} of {rotationTotal}
                  </p>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-white/60">
                    Your contribution
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight text-white">
                    {amountLabel}
                  </p>
                  <div className="mt-2">
                    {myCurrentStatus === "skipped" ? (
                      <p className="text-xs leading-5 text-white/65">
                        Ran before you joined — not yours to pay.
                      </p>
                    ) : myCurrentSettled ? (
                      myCurrentStatus === "late" ? (
                        <p className="text-xs font-medium text-[#F2B8B5]">
                          Paid late — the money arrived after the due date, so
                          trust took a hit.
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-white/90">
                          ✓ Paid
                          {myCurrentContribution?.paid_at
                            ? ` ${formatCycleDateShort(myCurrentContribution.paid_at)}`
                            : ""}
                        </p>
                      )
                    ) : member && enrolledCurrent ? (
                      <p className="text-xs leading-5 text-white/70">
                        Pending · due {formatCycleDate(currentCycle.due_date)}{" "}
                        — pay from the card above.
                      </p>
                    ) : (
                      <p className="text-xs text-white/65">
                        Due {formatCycleDate(currentCycle.due_date)}
                      </p>
                    )}
                  </div>
                </div>
                <div
                  className={`min-w-0 rounded-[12px] p-3.5 ${isMyTurn ? "bg-[#E2C98F]/15" : "bg-white/10"}`}
                >
                  <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-white/60">
                    {isMyTurn ? "Your turn" : "Receiver"}
                  </p>
                  <p
                    className={`mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight ${isMyTurn ? "text-[#E2C98F]" : "text-white"}`}
                  >
                    {currentPot ?? amountLabel}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/70">
                    {currentPayoutStatus === "completed"
                      ? isMyTurn
                        ? `✓ Received ${currentPayout?.paid_at ? formatCycleDateShort(currentPayout.paid_at) : formatCycleDate(currentCycle.due_date)}`
                        : currentRecipient
                          ? `${currentRecipient} received`
                          : "Disbursed"
                      : currentPayoutStatus === "failed"
                        ? "Payout failed — contact the organizer"
                        : isMyTurn
                          ? `You receive · ${formatCycleDate(currentCycle.due_date)}`
                          : currentRecipient
                            ? `${currentRecipient} receives · ${formatCycleDate(currentCycle.due_date)}`
                            : `Due ${formatCycleDate(currentCycle.due_date)}`}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs tabular-nums text-white/65">
                  {settledCount} / {expectedCount} contributions received
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-[#E2C98F]"
                    style={{
                      width: `${expectedCount > 0 ? Math.min(100, Math.round((settledCount / expectedCount) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </section>
          </div>

          {upcomingCycles.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-display text-lg font-semibold tracking-tight text-text-primary">
                Upcoming turns
              </h2>
              <ul className="flex flex-col gap-2">
                {upcomingCycles.map((cycle) =>
                  renderTurnRow(cycle, "upcoming"),
                )}
              </ul>
            </section>
          )}

          {pastCycles.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-display text-lg font-semibold tracking-tight text-text-primary">
                Previous turns
              </h2>
              <ul className="flex flex-col gap-2">
                {pastCycles.map((cycle) => renderTurnRow(cycle, "past"))}
              </ul>
            </section>
          )}
        </>
      ) : null}

      {showSync && (
        <ScheduleGenerator
          groupId={group.id}
          frequency={group.frequency}
          memberCount={activeCount ?? scheduledCount}
          mode="sync"
          newCount={(activeCount ?? scheduledCount) - scheduledCount}
        />
      )}

      {/* Members live at the bottom as a compact single-column list. */}

      {membersPanel}

      {member && (
        <section className="flex flex-col gap-3">
          <LedgerFeed
            initialDue={ledger.due}
            initialHistory={ledger.history}
            groupId={id}
            previewCount={5}
            title="Recent activity"
          />
        </section>
      )}

      {member && requests && requests.length > 0 && (
        <section
          id="pending-requests"
          className={`${ANCHOR_MT} flex flex-col gap-3`}
        >
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {request.applicant_name ?? "Applicant"}
                      </p>
                      {request.applicant_phone && (
                        <p className="font-mono text-xs tabular-nums text-text-secondary">
                          {request.applicant_phone}
                        </p>
                      )}
                      <p className="text-xs text-text-secondary">
                        {request.inviter_name
                          ? `Invited by ${request.inviter_name}`
                          : "Joined via link"}
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-xs tabular-nums text-text-secondary">
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
