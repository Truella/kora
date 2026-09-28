// Circle workspace UI types. Data lives in @/constants/circle; components
// import the types from here.

export type MemberRow = {  id: string;
  initial: string;
  name: string;
  you?: boolean;
  next?: boolean;
  role: string;
  // Profile photo. Null when the member has none — the initial wash
  // covers it.
  avatarUrl?: string | null;
  // Receive slot in the rotation.
  slot: number;
  // This turn's share state. Null pre-schedule, when per-turn states
  // don't exist yet.
  share?: "paid" | "pending" | "late" | null;
  // Cached score. Null until the first settled share — rendered as
  // "No score yet" rather than an unearned 100.
  trust?: number | null;
};

// ---- Circle overview view model (built server-side in lib/overview-*) ----

export type CircleMemberRow = {
  id: string;
  user_id: string;
  payout_position: number | null;
  joined_at: string;
};

export type UpcomingTurnRow = {
  anchorId: string;
  turnNumber: number;
  meta: string;
  shareLine: string;
};

export type TurnContributionState =
  | { kind: "skipped" }
  | { kind: "paid"; late: boolean; paidAt: string | null }
  | { kind: "pending-member"; due: string }
  | { kind: "plain"; due: string };

export type CurrentTurnModel = {
  cycleId: string;
  anchorId: string;
  turnNumber: number;
  status: string;
  chip: { kind: "settled" } | { kind: "due"; label: string };
  positionLine: string | null;
  contributionAmount: string;
  contribution: TurnContributionState;
  receiver: {
    label: string;
    amount: string;
    highlight: boolean;
    sub: string;
  };
  settled: number;
  expected: number;
  contributionDue: {
    turnNumber: number;
    amount: string;
    due: string;
  } | null;
  payoutReady: {
    turnNumber: number;
    pot: string | null;
  } | null;
};

export type OverviewSchedule =
  | { kind: "ready" }
  | { kind: "generate"; memberCount: number }
  | { kind: "waiting" };

export type OverviewData = {
  found: true;
  groupId: string;
  amountLabel: string;
  frequency: string;
  confirming: boolean;
  isCompleted: boolean;
  hasMember: boolean;
  isCreator: boolean;
  overdue: {
    count: number;
    firstNumber: number;
    firstDue: string;
  } | null;
  dueSoon: {
    amountLabel: string;
    firstDue: string;
    firstNumber: number;
    extra: number;
  } | null;
  schedule: OverviewSchedule;
  current: CurrentTurnModel | null;
  upcoming: UpcomingTurnRow[];
  sync: {
    memberCount: number;
    newCount: number;
  } | null;
};

export type OverviewViewModel = { found: false } | OverviewData;

// Group creation domain.
export type Currency = "NGN" | "GHS" | "KES" | "UGX";

export type NewGroupValues = {
  name: string;
  description: string;
  amount: string;
  threshold: number;
};
