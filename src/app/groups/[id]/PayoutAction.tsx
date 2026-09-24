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
export default function PayoutAction({
  cycleId,
  payoutStatus,
}: {
  cycleId: string;
  payoutStatus: string;
}) {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  if (payoutStatus === "completed") {
    return (
      <p className="text-xs text-success">
        Payout disbursed — the pot went to this cycle&apos;s receiver.
      </p>
    );
  }
  if (payoutStatus === "failed") {
    return (
      <p className="text-xs font-medium text-danger">
        Payout failed — contact the organizer to retry disbursement.
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
    <div className="flex flex-col gap-2">
      <motion.button
        type="button"
        onClick={handleComplete}
        disabled={working}
        whileTap={{ scale: 0.97 }}
        className="flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {working ? "Disbursing…" : "Mark payout disbursed"}
        {!working && <HugeiconsIcon icon={ArrowRight01Icon} size={18} />}
      </motion.button>
      {message && (
        <p className="rounded-[10px] bg-[#F8EDD9] px-4 py-2.5 text-sm text-[#8A5F14]">
          {message}
        </p>
      )}
    </div>
  );
}
