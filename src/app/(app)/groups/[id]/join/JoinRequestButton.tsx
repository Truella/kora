"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";

// Sends one join request. RLS ("apply to join") lets any signed-in
// user insert their own row — no membership needed to apply.
// Applicants can read their own request status (never vote counts) via
// the "applicants view own requests" policy — success copy sets that
// expectation.
//
// Re-apply: the (group_id, applicant_id) unique row persists after a
// decision, so a rejected applicant first deletes their own rejected
// row (allowed by the rejected-only delete policy — pending rows can
// never be wiped, closing the vote-reset exploit), then inserts fresh.
// invited_by rides along best-effort: a faked id fails the DB check,
// so the insert is retried bare and attribution falls back to NULL.
export default function JoinRequestButton({
  groupId,
  invitedBy,
}: {
  groupId: string;
  invitedBy?: string | null;
}) {
  const [state, setState] = useState<
    "idle" | "sending" | "sent" | "duplicate" | "invalid" | "error"
  >("idle");
  const router = useRouter();

  async function handleApply() {
    setState("sending");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Session expired mid-page — send through login with the full
        // join URL (incl. ?by=) so attribution survives the round-trip.
        const joinPath = `/groups/${groupId}/join${invitedBy ? `?by=${invitedBy}` : ""}`;
        router.push(`/login?next=${encodeURIComponent(joinPath)}`);
        return;
      }
      // Clear a past rejection first (no-op when there is none) so a
      // second application starts a fresh vote. Only rejected rows are
      // deletable — the policy refuses pending ones.
      await supabase
        .from("join_requests")
        .delete()
        .eq("group_id", groupId)
        .eq("applicant_id", user.id)
        .eq("status", "rejected");
      const insertRequest = (inviter: string | null) =>
        supabase.from("join_requests").insert({
          group_id: groupId,
          applicant_id: user.id,
          ...(inviter ? { invited_by: inviter } : {}),
        });
      let { error } = await insertRequest(invitedBy ?? null);
      // A faked/foreign inviter id fails the DB membership check —
      // retry bare so attribution degrades to NULL instead of an error.
      if (error && error.code !== "23505" && error.code !== "23503") {
        ({ error } = await insertRequest(null));
      }
      if (!error) {
        setState("sent");
        return;
      }
      // Unique (group_id, applicant_id) — one request row each. After
      // the pre-delete above, a duplicate means the request is pending
      // (or approved): the outcome is known to members, not shown here.
      if (error.code === "23505") setState("duplicate");
      // FK violation — the link's group id matches no circle.
      else if (error.code === "23503") setState("invalid");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className="rounded-[10px] bg-[#E0ECE9] px-4 py-3 text-sm leading-6 text-[#1E5A4E]">
        Request sent. The circle votes on new members — someone from the
        group will tell you the outcome.
      </p>
    );
  }

  if (state === "duplicate") {
    return (
      <p className="rounded-[10px] bg-[#F8EDD9] px-4 py-3 text-sm leading-6 text-[#8A5F14]">
        You already have a request in for this circle — the vote is still
        going. Ask a member for the outcome.
      </p>
    );
  }

  if (state === "invalid") {
    return (
      <p className="rounded-[10px] bg-[#F3E1E0] px-4 py-3 text-sm leading-6 text-[#8A2A21]">
        This invite link looks invalid — ask the sender for a fresh one.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        type="button"
        onClick={handleApply}
        disabled={state === "sending"}
        whileTap={{ scale: 0.97 }}
        className="flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Request to join"}
        {state !== "sending" && (
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
        )}
      </motion.button>
      {state === "error" && (
        <p className="rounded-[10px] bg-[#F3E1E0] px-4 py-2.5 text-sm text-[#8A2A21]">
          Could not send the request. Check your connection and try again.
        </p>
      )}
    </div>
  );
}
