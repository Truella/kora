"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Post-checkout banner with a real outcome. The ?paid=1 param only starts
// the watch — success is a paid contributions row newer than our return
// (server-verified via webhook), never the param itself.
// Success shows briefly, then the param is cleaned so a refresh won't
// re-poll. No-payment settles on a persistent terminal state with an
// explicit dismiss (the param stays, so the message survives refresh).
export default function ConfirmingBanner({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<"waiting" | "confirmed" | "absent">(
    "waiting",
  );

  useEffect(() => {
    const supabase = createClient();
    // Grace window for clock skew — anything paid after we left for
    // Flutterwave counts, even if the webhook beat us back.
    const since = new Date(Date.now() - 60_000).toISOString();
    let ticks = 0;
    let settled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    async function paidSinceReturn(): Promise<boolean> {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return false;
        const { data: membership } = await supabase
          .from("group_members")
          .select("id")
          .eq("group_id", groupId)
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();
        const memberId = (membership as { id: string } | null)?.id;
        if (!memberId) return false;
        const { data: cycles } = await supabase
          .from("cycles")
          .select("id")
          .eq("group_id", groupId);
        const ids = ((cycles ?? []) as { id: string }[]).map((c) => c.id);
        if (ids.length === 0) return false;
        const { data: rows } = await supabase
          .from("contributions")
          .select("id")
          .eq("member_id", memberId)
          .in("cycle_id", ids)
          .in("status", ["paid", "late"])
          .gte("paid_at", since)
          .limit(1);
        return (rows ?? []).length > 0;
      } catch {
        return false;
      }
    }

    async function tick() {
      if (settled) return;
      ticks += 1;
      router.refresh();
      if (await paidSinceReturn()) {
        settled = true;
        if (timer) clearInterval(timer);
        setOutcome("confirmed");
        // Let the success land, then clean the param so refreshes
        // show the paid badge without re-polling.
        hideTimer = setTimeout(() => {
          router.replace(`/groups/${groupId}`);
        }, 6000);
        return;
      }
      if (ticks >= 6) {
        settled = true;
        if (timer) clearInterval(timer);
        setOutcome("absent");
      }
    }

    timer = setInterval(() => void tick(), 4000);
    void tick();
    return () => {
      if (timer) clearInterval(timer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [groupId, router]);

  if (outcome === "confirmed") {
    return (
      <div className="rounded-[10px] bg-[#E0ECE9] px-4 py-3 text-sm font-medium text-[#1E5A4E]">
        Payment confirmed. Receipt verified. Your share is marked paid below.
      </div>
    );
  }

  if (outcome === "absent") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[10px] bg-[#F8EDD9] px-4 py-3 text-sm text-[#8A5F14]">
        <p>
          No payment went through. No money left your account. If you
          cancelled on Flutterwave, hit Pay below to retry.
        </p>
        <button
          type="button"
          onClick={() => router.replace(`/groups/${groupId}`)}
          className="shrink-0 rounded-[10px] border-[0.5px] border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-primary"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] bg-[#F8EDD9] px-4 py-3 text-sm text-[#8A5F14]">
      Back from Flutterwave. Confirming your payment. Give it a few seconds;
      this page updates on its own.
    </div>
  );
}
