"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowRight01Icon, Link01Icon } from "@hugeicons/core-free-icons";
import type { HomeSnapshot } from "@/lib/home";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

// Circles are invite-only by design — SCOPE.md puts public/stranger pools out
// of scope, so there is no directory to browse and no discovery surface here.
// The paste field just turns a link someone already sent you into the join
// page. A bare id or a bare /groups/<id>/join path is accepted too, because
// that is what survives being copied out of a chat app.
function extractGroupId(raw: string): string | null {
  const match = new RegExp(
    `/groups/(${UUID})(?:/join)?`,
    "i",
  ).exec(raw.trim());
  if (match) return match[1].toLowerCase();
  const bare = new RegExp(`^(${UUID})$`, "i").exec(raw.trim());
  return bare ? bare[1].toLowerCase() : null;
}

export default function QuickActions({ snapshot }: { snapshot: HomeSnapshot }) {
  const router = useRouter();
  const [invite, setInvite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { makeContributionHref } = snapshot;

  function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    const groupId = extractGroupId(invite);
    if (!groupId) {
      setError("That doesn't look like an invite link. Paste the full link.");
      return;
    }
    router.push(`/groups/${groupId}/join`);
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold text-text-primary">
        Quick actions
      </h2>

      <div className="flex flex-col gap-2 sm:flex-row">
        <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
          <Link
            href="/groups/new"
            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <HugeiconsIcon icon={Add01Icon} size={18} />
            Create circle
          </Link>
        </motion.div>

        {/* One owed cycle goes straight to it; several go to the queue already
            on screen; nothing owed means the action is hidden rather than
            shown dead. This never starts a payment — PayButton →
            create-charge → Flutterwave stays the only path that moves money. */}
        {makeContributionHref && (
          <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
            <Link
              href={makeContributionHref}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Make contribution
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
            </Link>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleJoin} className="flex flex-col gap-2">
        <label
          htmlFor="invite-link"
          className="flex items-center gap-1.5 text-sm font-medium text-text-primary"
        >
          <HugeiconsIcon icon={Link01Icon} size={16} className="text-text-secondary" />
          Join a circle
        </label>
        <div className="flex gap-2">
          <input
            id="invite-link"
            value={invite}
            onChange={(e) => {
              setInvite(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste an invite link"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-secondary/70 focus:border-primary"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            className="shrink-0 rounded-[10px] border-[0.5px] border-border bg-surface px-5 py-[13px] text-sm font-semibold text-primary hover:bg-black/[0.03]"
          >
            Join
          </motion.button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </section>
  );
}
