import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import CircleTabs from "./CircleTabs";
import InviteMenu from "./InviteMenu";

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

// Shared circle header: identity row (mark + name + amount · frequency ·
// members + status pill) with the section tab bar merged underneath. Used by
// overview, ledger and members so the tabs persist across all three views.
// `trailing` renders extra header actions (e.g. the ledger export button)
// beside Invite on the right of the tab row.
export default function CircleHeader({
  group,
  memberCount,
  inviterId,
  showInvite,
  active,
  trailing,
}: {
  group: {
    id: string;
    name: string;
    contribution_amount: number | string;
    currency: string;
    frequency: string;
    status: string;
  };
  memberCount: number;
  inviterId: string | null;
  showInvite: boolean;
  active: "overview" | "ledger" | "members";
  trailing?: ReactNode;
}) {
  const symbol = SYMBOLS[group.currency] ?? group.currency;
  const amountLabel = `${symbol}${Number(group.contribution_amount).toLocaleString()}`;

  return (
    <div className="flex flex-col gap-3">
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
            {memberCount === 1 ? "1 member" : `${memberCount} members`}
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[group.status] ?? STATUS_BADGE.active}`}
            >
              {STATUS_LABEL[group.status] ?? group.status}
            </span>
          </p>
        </div>
        {/* Mobile only: actions dock into the identity row so the tab row
            below has the full width for its three tabs. Desktop keeps them
            beside the tabs (see below) — only one placement is visible at
            any breakpoint. */}
        {(trailing || (showInvite && inviterId)) && (
          <div className="flex shrink-0 items-center gap-2 sm:hidden">
            {trailing}
            {showInvite && inviterId && (
              <InviteMenu groupId={group.id} inviterId={inviterId} />
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <CircleTabs groupId={group.id} active={active} />
        {(trailing || (showInvite && inviterId)) && (
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            {trailing}
            {showInvite && inviterId && (
              <InviteMenu groupId={group.id} inviterId={inviterId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
