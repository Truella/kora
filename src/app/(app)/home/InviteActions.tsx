"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";

// Accept files the same join request the link flow files — the circle still
// votes (accept_circle_invite inserts into join_requests, it never admits
// directly). Decline just consumes the nudge; the inviter can send again.
// Local done-copy, no router.refresh(): the snapshot still lists the invite,
// and a refresh would unmount this row before the confirmation is read.
export default function InviteActions({
  inviteId,
  groupId,
}: {
  inviteId: string;
  groupId: string;
}) {
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function act(kind: "accept" | "decline") {
    setBusy(kind);
    setError(false);
    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        kind === "accept" ? "accept_circle_invite" : "decline_circle_invite",
        { p_invite_id: inviteId },
      );
      if (rpcError) {
        setError(true);
        return;
      }
      if (data === "accepted" || data === "already_pending") {
        setDone(
          "Request sent. The circle votes every new member in. Someone from the group will tell you the outcome.",
        );
      } else if (data === "already_member") {
        setDone("You're already in this circle.");
      } else if (data === "declined") {
        setDone("Invite declined.");
      } else {
        setDone("Done.");
      }
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs leading-5 text-text-secondary">{done}</p>
        {(done.startsWith("Request sent") || done.startsWith("You're already")) && (
          <Link
            href={`/groups/${groupId}/join`}
            className="text-xs font-semibold text-text-primary underline underline-offset-2"
          >
            Check request status
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <motion.button
          type="button"
          onClick={() => act("accept")}
          disabled={busy !== null}
          whileTap={{ scale: 0.97 }}
          className="flex-1 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {busy === "accept" ? "Accepting…" : "Accept"}
        </motion.button>
        <motion.button
          type="button"
          onClick={() => act("decline")}
          disabled={busy !== null}
          whileTap={{ scale: 0.97 }}
          className="flex-1 rounded-[10px] border-[0.5px] border-border bg-white px-4 py-2.5 text-sm font-semibold text-text-primary disabled:opacity-60"
        >
          {busy === "decline" ? "Declining…" : "Decline"}
        </motion.button>
      </div>
      {error && (
        <p className="text-xs font-medium text-danger">
          Could not update the invite. Try again.
        </p>
      )}
    </div>
  );
}
