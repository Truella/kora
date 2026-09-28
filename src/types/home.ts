// Home snapshot types (command-centre data for /home).
// Moved out of lib/home.ts so UI imports types without pulling in queries.

export type HomeMoney = {
  currency: string;
  label: string;
  amount: number;
};

export type HomeTotals = {
  contributed: HomeMoney;
  received: HomeMoney | null;
  month: HomeMoney;
  monthCount: number;
  monthName: string;
  others: { currency: string; label: string; amount: number; circleCount: number }[];
  hasAny: boolean;
};

export type HomePaymentProgress = {
  settledCount: number;
  onTimeCount: number;
  lateCount: number;
  percent: number;
};

export type HomeAttention =
  | {
      kind: "money";
      tone: "overdue" | "soon";
      groupId: string;
      groupName: string;
      cycleId: string;
      cycleNumber: number;
      dueDate: string;
      dueLabel: string;
      amountLabel: string;
      daysLate: number;
      href: string;
    }
  | {
      kind: "vote";
      groupId: string;
      groupName: string;
      pendingCount: number;
      href: string;
    };

export type HomeCircle = {
  groupId: string;
  name: string;
  status: "forming" | "active" | "paused" | "completed";
  currency: string;
  amountLabel: string;
  savedLabel: string;
  targetLabel: string;
  cyclesEnrolled: number;
  cyclesSettled: number;
  percent: number;
  showBar: boolean;
  awaitingSchedule: boolean;
  nextDueLabel: string | null;
  payoutNote: string | null;
  urgent: boolean;
  // Cadence remains useful beside the circle name; membership and round-count
  // tiles were removed from the card because they repeated information already
  // available on the circle detail page.
  frequency: string;
  // The member's own position in the rotation: their payout round number and
  // the circle size. Null when the rotation has no row naming them yet (e.g.
  // joined after every cycle ran) — the card then falls back to circle totals.
  myRoundNumber: number | null;
  rotationTotal: number;
  memberCount: number;
  // Null once the round has been paid out — at that point it belongs in
  // activity as "You received", and repeating it here would be a second,
  // staler copy of the same fact.
  myPayoutLabel: string | null;
  myPayoutDateLabel: string | null;
  // Current turn in flight (the inPlay cycle the payoutNote is about).
  // Needed so the card never presents the member's *future* payout as if
  // they were collecting now.
  currentTurnNumber: number | null;
  isMyTurnNow: boolean;
  currentPotLabel: string | null;
  currentDueLabel: string | null;
  // True when the caller is one of the outstanding shares blocking the
  // current payout — the note then names them ("waiting on you") instead
  // of the anonymous "waiting on 1 member".
  waitingOnYou: boolean;
  href: string;
};

export type HomeActivity = {
  id: string;
  tone: "paid" | "received" | "circle-payout";
  headline: string;
  amountLabel: string;
  groupName: string;
  dayLabel: string;
  // "Turn 3" — turns a ledger line into an event in the rotation. Free: the
  // cycle is already resolved for every activity row.
  contextLabel: string | null;
};

// Directed phone invite awaiting this user. Resolved server-side by the
// my_pending_invites() RPC (verified-phone match — no directory lookup), so
// the snapshot carries names the caller's RLS could never read directly.
export type HomeInvite = {
  inviteId: string;
  groupId: string;
  groupName: string;
  inviterName: string;
  href: string;
};

/** Sort key is build-time only and never serialized. */
export type RankedActivity = HomeActivity & { sortKey: number };

export type HomeSnapshot = {
  greeting: "morning" | "afternoon" | "evening";
  firstName: string | null;
  totals: HomeTotals;
  activeCircleCount: number;
  paymentProgress: HomePaymentProgress;
  attention: HomeAttention[];
  invites: HomeInvite[];
  circles: HomeCircle[];
  circlesTotal: number;
  activity: HomeActivity[];
};

// Raw Supabase row shapes read by the snapshot builder.
export type GroupRow = {  id: string;
  name: string;
  currency: string;
  contribution_amount: number | string;
  frequency: string;
  status: string;
  created_at: string | null;
};

export type MemberRow = {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
};

export type CycleRow = {
  id: string;
  group_id: string;
  cycle_number: number;
  // Which member this round pays out to. One extra column on a row we already
  // fetch, and it carries the entire rotation model: "your round" is simply the
  // cycle that names you. Nullable in the sense that a member who joins after
  // the rotation was generated is named by no cycle until a sync appends one —
  // hence the null-tolerant reads below rather than an assumption.
  recipient_member_id: string;
  due_date: string;
  status: string;
};

export type ContributionRow = {
  id: string;
  cycle_id: string;
  member_id: string;
  amount: number | string;
  status: string;
  paid_at: string | null;
};

export type PayoutRow = {
  id: string;
  cycle_id: string;
  recipient_member_id: string;
  amount: number | string;
  status: string;
  paid_at: string | null;
};

export type JoinRequestRow = {
  id: string;
  group_id: string;
  created_at: string | null;
};

export type InviteRpcRow = {
  invite_id: string;
  group_id: string;
  group_name: string;
  inviter_name: string;
  created_at: string | null;
};

// ---- Snapshot pipeline contexts (built phase by phase in lib/home-*) ----

export type SettledContribution = {
  contribution: ContributionRow;
  cycle: CycleRow;
  group: GroupRow;
};

export type HomeRawBundle = {
  userId: string;
  offset: number;
  today: { y: number; m: number; d: number };
  month: string;
  firstName: string | null;
  groups: GroupRow[];
  invites: HomeInvite[];
  members: MemberRow[];
  cycles: CycleRow[];
  requests: JoinRequestRow[];
  myContributions: ContributionRow[];
  settledCountRows: { cycle_id: string; member_id: string }[];
  payouts: PayoutRow[];
  voteRows: { join_request_id: string }[];
  groupById: Map<string, GroupRow>;
  cycleById: Map<string, CycleRow>;
  cyclesByGroup: Map<string, CycleRow[]>;
  payoutByCycle: Map<string, PayoutRow>;
};

export type OwedItem = {
  groupId: string;
  groupName: string;
  cycleId: string;
  cycleNumber: number;
  dueDate: string;
  amountLabel: string;
  days: number;
};

export type OwedContext = {
  owedByGroup: Map<string, OwedItem[]>;
  moneyItems: Extract<HomeAttention, { kind: "money" }>[];
  voteItems: Extract<HomeAttention, { kind: "vote" }>[];
  attention: HomeAttention[];
  mySettledByCycle: Map<string, ContributionRow>;
  joinedDateByGroup: Map<string, string>;
  settledMembersByCycle: Map<string, Set<string>>;
  myMemberIdByGroup: Map<string, string>;
  membersByGroup: Map<string, { id: string; joined_at: string }[]>;
  activeCountByGroup: Map<string, number>;
};

export type TotalsContext = {
  totals: HomeTotals;
  paymentProgress: HomePaymentProgress;
  savedByGroup: Map<string, number>;
  mySettled: SettledContribution[];
};
