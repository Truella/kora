"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";

// Sends one join request. RLS ("apply to join") lets any signed-in
// user insert their own row — no membership needed to apply.
// Applicants can't read the request afterwards (no select policy
// for outsiders), so success copy sets that expectation.
export default function JoinRequestButton({ groupId }: { groupId: string }) {
  const [state, setState] = useState<
    "idle" | "sending" | "sent" | "duplicate" | "invalid" | "error"
  >("idle");

  async function handleApply() {
    setState("sending");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState("error");
        return;
      }
      const { error } = await supabase.from("join_requests").insert({
        group_id: groupId,
        applicant_id: user.id,
      });
      if (!error) {
        setState("sent");
        return;
      }
      // Unique (group_id, applicant_id) — one request row each. The row
      // persists after a decision, so this covers pending, approved,
      // and rejected alike: neutral copy, the member knows the outcome.
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
      <p className="rounded-2xl bg-jade/10 px-4 py-3 text-sm leading-6 text-ink dark:text-white">
        Request sent. The circle votes on new members — someone from the
        group will tell you the outcome.
      </p>
    );
  }

  if (state === "duplicate") {
    return (
      <p className="rounded-2xl bg-gold/15 px-4 py-3 text-sm leading-6 text-ink dark:text-white">
        You already have a request in for this circle — ask a member for
        the outcome.
      </p>
    );
  }

  if (state === "invalid") {
    return (
      <p className="rounded-2xl bg-clay/10 px-4 py-3 text-sm leading-6 text-clay">
        This invite link looks invalid — ask the sender for a fresh one.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleApply}
        disabled={state === "sending"}
        className="flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Request to join"}
        {state !== "sending" && (
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
        )}
      </button>
      {state === "error" && (
        <p className="rounded-xl bg-clay/10 px-4 py-2.5 text-sm text-clay">
          Could not send the request. Check your connection and try again.
        </p>
      )}
    </div>
  );
}
