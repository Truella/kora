"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";

// Disbursement trigger for a cycle's payout. Payout rows are written only
// by the process-payout Edge Function (service role) — this just invokes
// it and refreshes into the completed/failed state it records. The function
// refuses until every active member's share is settled (paid/late), so this
// button is safe to show to any member: early taps get the count, not money.
//
// Contextual by design: it renders only while the payout is pending, as a
// small right-aligned receipt confirmation inside the hero's payout row —
// never a full-width giant. Settled/failed states are terminal copy, no
// button. Labeled "Confirm receipt" (not "Mark as paid") because completion
// is gated server-side on every share settling via payment webhooks —
// a tap without settled shares just returns the outstanding count.
export default function PayoutAction({
  cycleId,
  payoutStatus,
  paidAt,
  tone = "default",
}: {
  cycleId: string;
  payoutStatus: string;
  paidAt?: string | null;
  // On-dark for the petrol turn hero: gold button, light status copy.
  tone?: "default" | "onDark";
}) {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const onDark = tone === "onDark";
  if (payoutStatus === "completed") {
    return (
      <p
        className={`text-right text-xs font-medium ${onDark ? "text-white/85" : "text-[#1E5A4E]"}`}
      >
        ✓ Disbursed
        {paidAt ? ` ${new Date(paidAt).toLocaleDateString()}` : ""}
      </p>
    );
  }
  if (payoutStatus === "failed") {
    return (
      <p
        className={`text-right text-xs font-medium ${onDark ? "text-[#F2B8B5]" : "text-danger"}`}
      >
        Payout failed — contact the organizer to retry.
      </p>
    );
  }

  async function handleComplete() {
    setWorking(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data, error: fnError } = await supabase.functions.invoke(
        "process-payout",
        { body: { cycleId, action: "complete" } },
      );
      if (fnError) {
        const status = (fnError as { context?: { status?: number } })?.context
          ?.status;
        if (status === 409) {
          setMessage(
            "Not all shares are in yet — the payout unlocks once every member's contribution settles.",
          );
          router.refresh();
        } else {
          setMessage(
            "Could not reach the payout service. Check your connection and try again.",
          );
        }
        return;
      }
      if (data?.error) {
        if (
          typeof data.settled === "number" &&
          typeof data.expected === "number"
        ) {
          setMessage(
            `${data.settled} of ${data.expected} shares settled — the payout unlocks once every member's contribution settles.`,
          );
        } else if (data.error === "Payout already settled") {
          setMessage("This payout is already settled.");
          router.refresh();
        } else {
          setMessage("Could not disburse the payout. Try again.");
        }
        return;
      }
      router.refresh();
    } catch {
      setMessage("Could not reach the payout service. Try again.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <motion.button
        type="button"
        onClick={handleComplete}
        disabled={working}
        whileTap={{ scale: 0.97 }}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60 ${onDark ? "bg-[#E2C98F] text-[#0B2624] hover:bg-[#D8BE85]" : "bg-primary text-white hover:bg-primary-hover"}`}
      >
        {working ? "Confirming…" : "Confirm receipt"}
        {!working && <HugeiconsIcon icon={ArrowRight01Icon} size={14} />}
      </motion.button>
      {message && (
        <p className="max-w-[240px] rounded-[10px] bg-[#F8EDD9] px-3 py-2 text-right text-xs text-[#8A5F14]">
          {message}
        </p>
      )}
    </div>
  );
}
