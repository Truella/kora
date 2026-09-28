"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import VoteButtons from "./VoteButtons";

const ANCHOR_MT = "scroll-mt-[calc(var(--app-header-h)+1rem)]";

export type PendingRequest = {
  id: string;
  applicant_name: string | null;
  applicant_phone: string | null;
  inviter_name: string | null;
  applicant_avatar: string | null;
};

export type VoteTally = Record<string, { approve: number; reject: number }>;

function applicantInitial(name: string | null): string {
  return (name?.trim().charAt(0) || "·").toUpperCase();
}

// Live pending-requests: server snapshot in, realtime merges on top. Any
// INSERT/UPDATE on join_requests (new application, trigger-approved /
// trigger-rejected) or INSERT on join_votes refetches the (RLS-scoped)
// snapshot — cheap at this size and always consistent. Reconnect after a
// drop refetches too, so missed events never leave a silent gap.
//
// The wrapper stays mounted even with zero requests so the first
// application appears without a navigation — the section itself renders
// null until there is something to show.
export default function CircleRequestsLive({
  groupId,
  memberId,
  isCompleted,
  initialRequests,
  initialTally,
}: {
  groupId: string;
  memberId: string;
  isCompleted: boolean;
  initialRequests: PendingRequest[];
  initialTally: VoteTally;
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [tally, setTally] = useState(initialTally);

  // A fresh server snapshot (router.refresh() after a vote, say) must win
  // over state seeded at mount — otherwise the list sits on stale rows
  // until the next realtime event happens to arrive.
  const [synced, setSynced] = useState({
    requests: initialRequests,
    tally: initialTally,
  });
  if (initialRequests !== synced.requests || initialTally !== synced.tally) {
    setSynced({ requests: initialRequests, tally: initialTally });
    setRequests(initialRequests);
    setTally(initialTally);
  }

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: applicantRows } = await supabase.rpc(
        "pending_applicants",
        { p_group_id: groupId },
      );
      const next: PendingRequest[] = ((applicantRows ?? []) as Array<{
        request_id: string;
        applicant_name: string | null;
        applicant_phone: string | null;
        inviter_name: string | null;
        applicant_avatar: string | null;
      }>).map((r) => ({
        id: r.request_id,
        applicant_name: r.applicant_name,
        applicant_phone: r.applicant_phone,
        inviter_name: r.inviter_name,
        applicant_avatar: r.applicant_avatar ?? null,
      }));
      const nextTally: VoteTally = {};
      if (next.length > 0) {
        const { data: votes } = await supabase
          .from("join_votes")
          .select("join_request_id, vote")
          .in(
            "join_request_id",
            next.map((r) => r.id),
          );
        for (const v of (votes ?? []) as Array<{
          join_request_id: string;
          vote: string;
        }>) {
          const t = nextTally[v.join_request_id] ?? { approve: 0, reject: 0 };
          if (v.vote === "approve") t.approve += 1;
          else t.reject += 1;
          nextTally[v.join_request_id] = t;
        }
      }
      if (mounted.current) {
        setRequests(next);
        setTally(nextTally);
      }
    } catch (err) {
      // Keep the stale list; the next event or navigation will retry.
      console.error("pending requests refresh failed", err);
    }
  }, [groupId]);

  // Debounced so the trigger's vote-INSERT + request-UPDATE pair collapses
  // into one refetch instead of two back-to-back.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscribedOnce = useRef(false);
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    const notify = () => {
      if (cancelled) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void refresh();
      }, 300);
    };
    const channel = supabase
      .channel(`requests:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "join_requests",
          filter: `group_id=eq.${groupId}`,
        },
        notify,
      )
      .on(
        // join_votes carries no group column, so this fires for every
        // circle the client can see — the refetch is RLS-scoped to this
        // group and cheap, same tradeoff LedgerFeed already makes.
        "postgres_changes",
        { event: "*", schema: "public", table: "join_votes" },
        notify,
      )
      .subscribe((status) => {
        if (cancelled) return;
        // First SUBSCRIBED has fresh server data; anything later is a
        // reconnect after a drop, so resync to cover missed events.
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
  }, [groupId, refresh]);

  if (requests.length === 0) return null;

  return (
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
            const t = tally[request.id] ?? { approve: 0, reject: 0 };
            const name = request.applicant_name ?? "Applicant";
            return (
              <li
                key={request.id}
                className="flex flex-col gap-3 rounded-[14px] border-[0.5px] border-border bg-surface p-4"
              >
                <div className="flex items-center gap-3">
                  {request.applicant_avatar ? (
                    <Image
                      src={request.applicant_avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-[15px] font-semibold text-text-secondary"
                    >
                      {applicantInitial(request.applicant_name)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {name}
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
                  <span className="shrink-0 rounded-full bg-black/[0.05] px-2 py-px font-mono text-[11px] font-semibold tabular-nums text-text-secondary">
                    {t.approve} yes · {t.reject} no
                  </span>
                </div>
                <VoteButtons joinRequestId={request.id} memberId={memberId} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
