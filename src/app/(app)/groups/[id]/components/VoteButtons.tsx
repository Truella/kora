"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";

// Casts one vote on a join request. voter_id is the caller's
// group_members row id (not the user id) — RLS enforces same-circle
// voting, so a member of one circle can't vote on another's requests.
// The tally_join_votes trigger decides approve/reject from here, and
// only while the request is still pending.
export default function VoteButtons({
  joinRequestId,
  memberId,
}: {
  joinRequestId: string;
  memberId: string;
}) {
  const [voting, setVoting] = useState<"approve" | "reject" | null>(null);
  const [voted, setVoted] = useState<"approve" | "reject" | "already" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function vote(choice: "approve" | "reject") {
    setVoting(choice);
    setError(null);
    try {
      const supabase = createClient();
      const { error: voteError } = await supabase.from("join_votes").insert({
        join_request_id: joinRequestId,
        voter_id: memberId,
        vote: choice,
      });
      if (voteError) {
        // Unique (join_request_id, voter_id) — one vote each.
        if (voteError.code === "23505") setVoted("already");
        else setError("Could not record your vote. Try again.");
        return;
      }
      setVoted(choice);
      // Trigger may have approved the request — refetch the list.
      router.refresh();
    } catch {
      setError("Could not record your vote. Try again.");
    } finally {
      setVoting(null);
    }
  }

  // Confirmation row: same footprint as the button pair it replaces so
  // the card doesn't collapse. Approve wears the success wash; reject and
  // already-voted wear neutral — a no-vote is a counted vote, not an error,
  // so the danger tint stays reserved for failures.
  if (voted) {
    const approved = voted === "approve";
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 ${
          approved
            ? "bg-[#E0ECE9]"
            : "bg-black/[0.04]"
        }`}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            approved ? "bg-[#1E5A4E] text-white" : "bg-black/[0.08] text-text-primary"
          }`}
        >
          <HugeiconsIcon
            icon={approved ? Tick01Icon : Cancel01Icon}
            size={15}
          />
        </span>
        <div className="min-w-0">
          <p
            className={`text-xs font-semibold ${
              approved ? "text-[#1E5A4E]" : "text-text-primary"
            }`}
          >
            {voted === "already"
              ? "You already voted"
              : `You voted to ${voted}`}
          </p>
          <p className="text-xs text-text-secondary">
            {voted === "already"
              ? "One vote per member — yours is counted."
              : "Your vote is counted."}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        {(["approve", "reject"] as const).map((choice) => (
          <motion.button
            key={choice}
            type="button"
            onClick={() => vote(choice)}
            disabled={voting !== null}
            whileTap={{ scale: 0.97 }}
            className={`flex-1 rounded-[10px] px-4 py-[13px] text-sm font-semibold capitalize disabled:opacity-60 ${
              choice === "approve"
                ? "bg-primary text-white hover:bg-primary-hover"
                : "border-[0.5px] border-border bg-white text-text-primary"
            }`}
          >
            {voting === choice ? "Voting…" : choice}
          </motion.button>
        ))}
      </div>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
