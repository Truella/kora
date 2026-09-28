"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import CircleTabs from "./CircleTabs";
import InviteMenu from "./InviteMenu";
import ExportButton from "../ledger/ExportButton";

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
// On the ledger tab the export action sits beside Invite.
export default function CircleHeader({
  group,
  memberCount,
  inviterId,
  showInvite,
  hasCycles,
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
  hasCycles: boolean;
}) {
  const pathname = usePathname();
  const base = `/groups/${group.id}`;
  const active = pathname === `${base}/ledger` ? "ledger" : pathname === `${base}/members` ? "members" : "overview";
  const trailing = active === "ledger" ? <ExportButton disabled={!hasCycles} /> : null;
  const symbol = SYMBOLS[group.currency] ?? group.currency;
  const amountLabel = `${symbol}${Number(group.contribution_amount).toLocaleString()}`;

  // Live roster count: server snapshot in, realtime merges on top. Admission
  // or removal fires group_members and the count follows without a refresh.
  const [count, setCount] = useState(memberCount);
  const [syncedCount, setSyncedCount] = useState(memberCount);
  if (memberCount !== syncedCount) {
    setSyncedCount(memberCount);
    setCount(memberCount);
  }
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const refreshCount = useCallback(async () => {
    try {
      const { count: next } = await createClient()
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", group.id)
        .eq("status", "active");
      if (mounted.current && typeof next === "number") setCount(next);
    } catch {
      // Keep the stale count; the next event or navigation will retry.
    }
  }, [group.id]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscribedOnce = useRef(false);
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    const notify = () => {
      if (cancelled) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void refreshCount();
      }, 300);
    };
    const channel = supabase
      .channel(`header-count:${group.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${group.id}`,
        },
        notify,
      )
      .subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          if (subscribedOnce.current) notify();
          else subscribedOnce.current = true;
        }
      });
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      void supabase.removeChannel(channel);
    };
  }, [group.id, refreshCount]);

  // One element, two placements: under the name on desktop, full-width
  // below the title row on mobile (where the actions sit beside the name).
  const meta = (
    <>
      {amountLabel} {group.frequency} ·{" "}
      {count === 1 ? "1 member" : `${count} members`}
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[group.status] ?? STATUS_BADGE.active}`}
      >
        {STATUS_LABEL[group.status] ?? group.status}
      </span>
    </>
  );

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
          <p className="mt-1 hidden flex-wrap items-center gap-2 font-display text-xs font-semibold tabular-nums text-text-secondary sm:flex">
            {meta}
          </p>
        </div>
        {/* Mobile only: actions dock into the identity row so the tab row
            below has the full width for its three tabs. Desktop keeps them
            beside the tabs (see below) — only one placement is visible at
            any breakpoint. */}
        {(trailing || (showInvite && inviterId)) && (
          <div className="flex shrink-0 items-center gap-2 sm:hidden">
            {showInvite && inviterId && (
              <InviteMenu groupId={group.id} inviterId={inviterId} />
            )}
            {trailing}
          </div>
        )}
      </div>
      <p className="flex flex-wrap items-center gap-2 pl-12 font-display text-xs font-semibold tabular-nums text-text-secondary sm:hidden">
        {meta}
      </p>
      <div className="flex items-center justify-between gap-2">
        <CircleTabs groupId={group.id} active={active} />
        {(trailing || (showInvite && inviterId)) && (
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            {showInvite && inviterId && (
              <InviteMenu groupId={group.id} inviterId={inviterId} />
            )}
            {trailing}
          </div>
        )}
      </div>
    </div>
  );
}
