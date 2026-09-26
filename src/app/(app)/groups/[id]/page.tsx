import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Activity01Icon,
  Book02Icon,
  UserGroupIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";
import PayButton from "./PayButton";
import PayoutAction from "./PayoutAction";
import ConfirmingBanner from "./ConfirmingBanner";
import InviteMenu from "./InviteMenu";
import VoteButtons from "./VoteButtons";
import ScheduleGenerator from "./ScheduleGenerator";
import LedgerFeed from "../../activity/LedgerFeed";
import {
  TurnHero,
  EventCard,
  TurnRow,
  ActionTile,
  DueChip,
  SettledChip,
} from "./TurnViews";
import { getLedgerEvents } from "@/lib/ledger";
import { utcDateOnly, formatCycleDate, formatCycleDateShort } from "@/lib/money";
import { collectTurnLabel } from "@/lib/rotation";

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

  // Finished circles read differently everywhere below: a banner names the
  // state outright, and the invite / sync / vote affordances go away — a
  // circle that is over for now must not silently gain members, dues or
  // turns. Restart-with-vote-in/out is the planned follow-up; until then
  // this flag is the seam it will build on.
  const isCompleted = group.status === "completed";

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
    !isCompleted &&
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
  const upcomingCycles = currentCycle
    ? sortedCycles.filter((c) => c.cycle_number > currentCycle.cycle_number)
    : [];

  // Per-member settlement for the current turn only — feeds the hero
  // progress bar. One RLS-covered select; history rows show the caller's
  // own share from byCycle instead.
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
  // they leave the nudge lists alone. Only the current turn is payable,
  // so only it can nudge — later turns open when it settles.
  const unpaidCycles = (cycles ?? []).filter((c) => {
    if (c.id !== currentCycle?.id) return false;
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

  // Active roster — feeds the caller's collector position, the payout-gate
  // member count, and the rotation size. Read-only: RLS "view members of your
  // groups" scopes to fellow members. Full profiles live on /members.
  type CircleMemberRow = {
    id: string;
    user_id: string;
    payout_position: number | null;
    joined_at: string;
  };
  const { data: circleMembers } = member
    ? await supabase
        .from("group_members")
        .select("id, user_id, payout_position, joined_at")
        .eq("group_id", id)
        .eq("status", "active")
        .order("payout_position", { ascending: true })
    : { data: [] };
  const circleRows = (circleMembers ?? []) as CircleMemberRow[];

  // The caller's own slot in the rotation, shown in the hero header. Null
  // positions hide the line rather than guessing — `collectPositionLabel`
  // also drops it when the slot falls outside the roster.
  const myCircleRow = user
    ? circleRows.find((m) => m.user_id === user.id)
    : undefined;
  const myTurnPosition = myCircleRow?.payout_position ?? null;
  const rotationTotal = circleRows.length;

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
  // Collection opens on the turn's due date even when every share is in
  // early — the confirm card stays a waiting note until then. Same basis
  // process-payout enforces, so the two can never disagree by a day.
  const collectOpen = currentCycle
    ? today >= currentCycle.due_date
    : false;

  // Compressed rows for the upcoming turns, via the shared TurnRow. Only
  // the current turn is payable (hero + event card), so these rows are
  // read-only: an unpaid one says when it opens instead of offering Pay.
  //
  // Completed turns are deliberately absent. `LedgerFeed` at the foot of this
  // page (plus /activity and the home activity strip) already carries every
  // settled contribution and payout with its turn number and date; the old
  // "Previous turns" list was a second copy of that ledger, saying the same
  // facts in a layout that read worse. UI-only removal — completed cycles and
  // payouts are still stored and still reachable through those feeds.
  const renderUpcomingRow = (cycle: (typeof sortedCycles)[number]) => {
    const contribution = byCycle.get(cycle.id);
    const enrolled = enrolledIn(cycle);
    const status = enrolled ? contribution?.status ?? "pending" : "skipped";
    const recipient = recipientNames.get(cycle.recipient_member_id) ?? null;
    // "You" when the caller is the collector — with the past-turn list gone,
    // this row is the only place a future turn says it is yours to receive.
    const receiver =
      member && cycle.recipient_member_id === member.id ? "You" : recipient;
    const pot = potFor(cycle.id);
    const shares = sharesFor(cycle.id);
    const date = formatCycleDate(cycle.due_date);
    const collectionSentence =
      shares === null
        ? null
        : `${shares} ${shares === 1 ? "person" : "people"} will pay ${amountLabel}${shares > 1 ? " each" : ""}.`;
    const paymentSentence = !pot
      ? receiver
        ? `${receiver} will receive the collected money on ${date}.`
        : `The collected money will be sent on ${date}.`
      : receiver
        ? `${receiver} will receive ${pot} on ${date}.`
        : `${pot} will be paid on ${date}.`;
    const meta =
      collectionSentence && paymentSentence
        ? `${collectionSentence} ${paymentSentence}`
        : paymentSentence;
    // The one fact only the caller can know: what this turn asks of them.
    // Every upcoming row has one, which is why the line is unconditional.
    // Rows never offer Pay — only the current turn (hero + event card) is
    // payable, so an unpaid future turn says when it opens instead.
    // The `skipped` branch is defensive — an upcoming turn's due date is
    // always after the join date, so it should be unreachable, and paying
    // into a turn you were never in is a worse lie than an extra sentence.
    const opener = currentCycle
      ? ` · pay opens after Turn ${currentCycle.cycle_number}`
      : "";
    const yourLine =
      status === "skipped"
        ? "You joined after this turn"
        : status === "paid"
          ? `You paid ${amountLabel}`
          : status === "late"
            ? `You paid ${amountLabel} late`
            : `You owe ${amountLabel}${opener}`;
    return (
      <TurnRow
        key={cycle.id}
        anchorId={`cycle-${cycle.id}`}
        turnNumber={cycle.cycle_number}
        meta={meta}
        shareLine={yourLine}
      />
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      {confirming && <ConfirmingBanner groupId={group.id} />}

      {/* Close-out: every member lands here after the last turn, so the
          state is named outright instead of inferred from missing buttons.
          Success wash, never gold — gold is value/status, and this is the
          terminal state, not an amount. */}
      {isCompleted && (
        <div className="rounded-[10px] bg-[#E0ECE9] px-4 py-3">
          <p className="font-display text-sm font-semibold text-text-primary">
            This circle is over — for now.
          </p>
          <p className="mt-0.5 text-sm leading-6 text-[#1E5A4E]">
            Every turn has been collected. Nothing is due, and no new turns
            will open. Your full history is in Recent activity below.
          </p>
        </div>
      )}

      {member && overdue.length > 0 && (
        <div className="rounded-[10px] bg-[#F3E1E0] px-4 py-3 text-sm text-[#8A2A21]">
          {overdue.length} contribution{overdue.length === 1 ? "" : "s"}{" "}
          overdue. Turn {overdue[0].cycle_number} was due{" "}
          {formatCycleDate(overdue[0].due_date)}. Pay now, late payments
          lower your trust score.
        </div>
      )}
      {member && dueSoon.length > 0 && (
        <div className="rounded-[10px] bg-[#F8EDD9] px-4 py-3 text-sm text-[#8A5F14]">
          {amountLabel} due {formatCycleDate(dueSoon[0].due_date)} (Turn{""}
          {dueSoon[0].cycle_number})
          {dueSoon.length > 1
            ? `, plus ${dueSoon.length - 1} more within 3 days`
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
        </div>
      </div>

      {!cycles || cycles.length === 0 ? (
        <>
          {/* A finished circle with no schedule is an organizer-closed
              edge (completed is writable via the creator update policy):
              the banner above already names the state, so neither the
              generator nor the waiting note renders here. */}
          {!isCompleted &&
            (member && isCreator ? (
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
                  The payout rotation has not been generated yet. The organizer
                  starts it once membership settles.
                </p>
              </div>
            ))}
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
              <EventCard
                tone="gold"
                eyebrow="Contribution due"
                title={
                  <>
                    Your {amountLabel} share · Turn{" "}
                    {currentCycle.cycle_number}
                  </>
                }
                sub={
                  <>
                    Due {formatCycleDate(currentCycle.due_date)}. Pay now,
                    late payments lower your trust score.
                  </>
                }
                action={
                  <PayButton
                    cycleId={currentCycle.id}
                    groupId={group.id}
                    amountLabel={amountLabel}
                  />
                }
              />
            )}
          {member &&
            currentPayoutStatus === "pending" &&
            payoutReady &&
            isMyTurn &&
            collectOpen && (
              <EventCard
                tone="teal"
                eyebrow="Everyone has paid"
                title={
                  <>
                    Turn {currentCycle.cycle_number}: {currentPot ?? "The money"}{" "}
                    is ready for you.
                  </>
                }
                sub="Everyone has paid. Confirm that you collected the money to complete this turn."
                action={
                  <div className="flex justify-end">
                    <PayoutAction
                      cycleId={currentCycle.id}
                      payoutStatus={currentPayoutStatus}
                    />
                  </div>
                }
              />
            )}
          {member &&
            currentPayoutStatus === "pending" &&
            payoutReady &&
            isMyTurn &&
            !collectOpen && (
              <EventCard
                tone="teal"
                eyebrow="Everyone has paid"
                title={
                  <>
                    Turn {currentCycle.cycle_number}: {currentPot ?? "The money"}{" "}
                    is ready.
                  </>
                }
                sub={`You can collect it on ${formatCycleDate(currentCycle.due_date)}.`}
                action={null}
              />
            )}
          <div className="flex flex-col gap-4">
            <TurnHero
              anchorId={`cycle-${currentCycle.id}`}
              turnNumber={currentCycle.cycle_number}
              chip={
                currentCycle.status === "completed" ? (
                  <SettledChip label="✓ Settled" />
                ) : (
                  <DueChip
                    label={`Due ${formatCycleDate(currentCycle.due_date)}`}
                  />
                )
              }
              positionLine={collectTurnLabel(myTurnPosition)}
              contributionAmount={amountLabel}
              contributionState={
                myCurrentStatus === "skipped" ? (
                  <p className="text-xs leading-5 text-white/65">
                    Ran before you joined. Not yours to pay.
                  </p>
                ) : myCurrentSettled ? (
                  myCurrentStatus === "late" ? (
                    <p className="text-xs font-medium text-[#F2B8B5]">
                      Paid late. It arrived after the due date, so your
                      trust score dropped.
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
                    Pending · due {formatCycleDate(currentCycle.due_date)}.
                    Pay from the card above.
                  </p>
                ) : (
                  <p className="text-xs text-white/65">
                    Due {formatCycleDate(currentCycle.due_date)}
                  </p>
                )
              }
              receiverLabel={isMyTurn ? "Your payout" : "Receiver"}
              receiverAmount={currentPot ?? amountLabel}
              receiverHighlight={isMyTurn}
              receiverSub={
                currentPayoutStatus === "completed" ? (
                  isMyTurn ? (
                    `✓ Received ${currentPayout?.paid_at ? formatCycleDateShort(currentPayout.paid_at) : formatCycleDate(currentCycle.due_date)}`
                  ) : currentRecipient ? (
                    `${currentRecipient} received`
                  ) : (
                    "Disbursed"
                  )
                ) : currentPayoutStatus === "failed" ? (
                  "Payout failed. Contact the organizer"
                ) : isMyTurn ? (
                  `You receive · ${formatCycleDate(currentCycle.due_date)}`
                ) : currentRecipient ? (
                  `${currentRecipient} receives · ${formatCycleDate(currentCycle.due_date)}`
                ) : (
                  `Due ${formatCycleDate(currentCycle.due_date)}`
                )
              }
              settled={settledCount}
              expected={expectedCount}
            />
          </div>

          {/* Quick actions — ledger, members, invite, recent activity. The
              invite tile hides on a finished circle (three tiles, so three
              columns — a 4-col grid would leave a dead cell). */}
          <nav
            aria-label="Quick actions"
            className={`grid gap-2 ${isCompleted ? "grid-cols-3" : "grid-cols-4"}`}
          >
            <ActionTile
              href={`/groups/${group.id}/ledger`}
              icon={<HugeiconsIcon icon={Book02Icon} size={24} />}
              label="Ledger"
            />
            <ActionTile
              href={`/groups/${group.id}/members`}
              icon={<HugeiconsIcon icon={UserMultipleIcon} size={24} />}
              label="Members"
            />
            {member && user && !isCompleted && (
              <InviteMenu groupId={group.id} inviterId={user.id} grid />
            )}
            <ActionTile
              href="#activity"
              icon={<HugeiconsIcon icon={Activity01Icon} size={24} />}
              label="Activity"
            />
          </nav>

          {upcomingCycles.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-display text-lg font-semibold tracking-tight text-text-primary">
                Upcoming turns
              </h2>
              <ul className="flex flex-col gap-2">
                {upcomingCycles.map((cycle) => renderUpcomingRow(cycle))}
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

      {member && (
        <section id="activity" className={`${ANCHOR_MT} flex flex-col gap-3`}>
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
          {isCompleted ? (
            <p className="rounded-[14px] border-[0.5px] border-border bg-surface p-4 text-xs leading-5 text-text-secondary">
              The circle is over, so voting is paused. Nobody new can join a
              finished circle — these requests stay pending.
            </p>
          ) : (
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
          )}
        </section>
      )}
    </main>
  );
}
