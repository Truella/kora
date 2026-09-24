"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";

// Creator-only schedule starter. Cycles/payouts have no client insert
// policy, so this just invokes the generate-schedule Edge Function
// (service role) and refreshes into the rotation it creates.
// mode "start" renders the full first-run card; mode "sync" renders a
// compact append card for members voted in after activation.
export default function ScheduleGenerator({
  groupId,
  frequency,
  memberCount,
  mode = "start",
  newCount = 0,
}: {
  groupId: string;
  frequency: string;
  memberCount: number;
  mode?: "start" | "sync";
  newCount?: number;
}) {
  const [firstDue, setFirstDue] = useState(() => defaultFirstDue(frequency));
  const [state, setState] = useState<"idle" | "working" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    setState("working");
    setMessage(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke(
        "generate-schedule",
        {
          body:
            mode === "sync" ? { groupId } : { groupId, firstDueDate: firstDue },
        },
      );
      if (error) {
        // Non-2xx comes back as FunctionsHttpError — a 5xx is the
        // service failing, anything else surfaces as a generic failure.
        const status = (error as { context?: { status?: number } })?.context
          ?.status;
        setMessage(
          status !== undefined && status >= 500
            ? "The schedule service failed. Try again in a moment."
            : "Could not update the rotation. Check your connection and try again.",
        );
        setState("error");
        return;
      }
      if (data?.error) {
        setMessage(
          typeof data.error === "string"
            ? data.error
            : "Could not update the rotation.",
        );
        setState("error");
        return;
      }
      const n = Number(data?.created ?? 0);
      const fixed = Number(data?.backfilled ?? 0);
      setMessage(
        n > 0
          ? mode === "sync"
            ? `Schedule synced — ${n} new cycle${n === 1 ? "" : "s"} appended.`
            : `Rotation live — ${n} cycle${n === 1 ? "" : "s"} scheduled from ${firstDue}.`
          : fixed > 0
            ? `Repaired ${fixed} cycle${fixed === 1 ? "" : "s"} missing payout${fixed === 1 ? "" : "s"}.`
            : "Schedule is already up to date.",
      );
      setState("done");
      router.refresh();
    } catch {
      setMessage(
        "Could not reach the schedule service. Check your connection and try again.",
      );
      setState("error");
    }
  }

  if (mode === "sync") {
    return (
      <div className="flex flex-col gap-3 rounded-[14px] border-[0.5px] border-border bg-surface p-5">
        <p className="text-sm leading-6 text-text-secondary">
          {newCount} new member{newCount === 1 ? "" : "s"} joined after the
          rotation started — sync appends their cycle
          {newCount === 1 ? "" : "s"} at the end.
        </p>
        {message && (
          <p
            className={`rounded-[10px] px-4 py-2.5 text-sm ${state === "error" ? "bg-[#F3E1E0] text-[#8A2A21]" : "bg-[#E0ECE9] text-[#1E5A4E]"}`}
          >
            {message}
          </p>
        )}
        {state !== "done" && (
          <motion.button
            type="button"
            onClick={handleGenerate}
            disabled={state === "working"}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {state === "working" ? "Syncing…" : "Sync schedule"}
            {state !== "working" && (
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
            )}
          </motion.button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border-[0.5px] border-border bg-surface p-5">
      <p className="font-display text-lg font-semibold text-text-primary">
        Start the rotation
      </p>
      <p className="text-sm leading-6 text-text-secondary">
        Creates one cycle per member in payout order ({memberCount} member
        {memberCount === 1 ? "" : "s"}), each with its pooled payout. New
        members voted in later get appended automatically when you rerun this.
      </p>
      <label
        htmlFor="first-due"
        className="text-sm font-medium text-text-primary"
      >
        First contribution due date
      </label>
      <input
        id="first-due"
        type="date"
        value={firstDue}
        // R1 guard: a first due date in the past would put cycle 1 before the
        // founder's own joined_at, and under "you owe only cycles that fell
        // due on or after you joined" they would owe nothing for their own
        // first round. min makes the invariant hold by construction rather
        // than trusting the picker.
        min={todayISO()}
        onChange={(e) => setFirstDue(e.target.value)}
        className="rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-3 font-mono text-sm text-text-primary outline-none focus:border-primary"
      />
      {message && (
        <p
          className={`rounded-[10px] px-4 py-2.5 text-sm ${state === "error" ? "bg-[#F3E1E0] text-[#8A2A21]" : "bg-[#E0ECE9] text-[#1E5A4E]"}`}
        >
          {message}
        </p>
      )}
        {state !== "done" && (
          <motion.button
            type="button"
            onClick={handleGenerate}
            disabled={state === "working" || !firstDue}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {state === "working" ? "Generating…" : "Generate schedule"}
            {state !== "working" && (
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
            )}
          </motion.button>
        )}
    </div>
  );
}

function defaultFirstDue(frequency: string): string {
  const d = new Date();
  if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
