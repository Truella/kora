"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";

// Starts a contribution payment via the create-charge Edge Function.
// Money rows are written server-side only — this just returns the
// Flutterwave hosted link and redirects out. Webhook flips paid.
export default function PayButton({
  cycleId,
  groupId,
  amountLabel,
}: {
  cycleId: string;
  groupId: string;
  amountLabel: string;
}) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handlePay() {
    setStarting(true);
    setError(null);
    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/groups/${groupId}?paid=1`;
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-charge",
        { body: { cycleId, redirectUrl } },
      );
      if (fnError) {
        // Non-2xx comes back as FunctionsHttpError with data === null —
        // notably the 409 on a stale page for an already-settled share
        // (paid or late — the body isn't parsed here, so word it to cover
        // both). Surface that distinctly instead of a generic
        // connectivity error.
        const status = (fnError as { context?: { status?: number } })?.context
          ?.status;
        if (status === 409) {
          setError("This contribution is already settled.");
          router.refresh();
        } else {
          setError(
            "Could not reach the payment service. Check your connection and try again.",
          );
        }
        return;
      }
      if (data?.error) {
        setError(
          data.error === "Already settled" || data.error === "Already paid"
            ? "This contribution is already settled."
            : "Could not start the payment. Try again.",
        );
        return;
      }
      if (!data?.paymentLink) {
        setError("Could not start the payment. Try again.");
        return;
      }
      window.location.href = data.paymentLink as string;
    } catch {
      setError("Could not reach the payment service. Try again.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        type="button"
        onClick={handlePay}
        disabled={starting}
        whileTap={{ scale: 0.97 }}
        className="flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {starting ? "Starting payment…" : `Pay your ${amountLabel} share`}
        {!starting && <HugeiconsIcon icon={ArrowRight01Icon} size={18} />}
      </motion.button>
      {error && (
        <p className="rounded-[10px] bg-[#F3E1E0] px-4 py-2.5 text-sm text-[#8A2A21]">
          {error}
        </p>
      )}
    </div>
  );
}
