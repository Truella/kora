"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
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

  if (voted) {
    return (
      <p className="text-xs text-indigo/50">
        {voted === "already"
          ? "You already voted on this request."
          : `You voted ${voted}.`}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {(["approve", "reject"] as const).map((choice) => (
          <motion.button
            key={choice}
            type="button"
            onClick={() => vote(choice)}
            disabled={voting !== null}
            whileTap={{ scale: 0.97 }}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold capitalize disabled:opacity-60 ${
              choice === "approve"
                ? "bg-indigo/15 text-indigo"
                : "bg-gold/15 text-indigo"
            }`}
          >
            {voting === choice ? "Voting…" : choice}
          </motion.button>
        ))}
      </div>
      {error && <p className="text-sm text-indigo">{error}</p>}
    </div>
  );
}
