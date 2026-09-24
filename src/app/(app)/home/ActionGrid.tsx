"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Activity01Icon,
  Link01Icon,
  UserGroupIcon,
  UserMultipleIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import type { HomeSnapshot } from "@/lib/home";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

// A pasted link (or bare id / bare /groups/<id>/join path — that is what
// survives being copied out of a chat app) resolves to the join page.
function extractGroupId(raw: string): string | null {
  const match = new RegExp(
    `/groups/(${UUID})(?:/join)?`,
    "i",
  ).exec(raw.trim());
  if (match) return match[1].toLowerCase();
  const bare = new RegExp(`^(${UUID})$`, "i").exec(raw.trim());
  return bare ? bare[1].toLowerCase() : null;
}

type Tile = {
  key: string;
  label: string;
  href?: string;
  onSelect?: () => void;
  icon: typeof Wallet01Icon;
  badge?: number;
  primary?: boolean;
};

function ActionTile({ tile }: { tile: Tile }) {
  const body = (
    <>
      <motion.span
        whileTap={{ scale: 0.93 }}
        className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${
          tile.primary
            ? "bg-primary text-white"
            : "bg-primary/10 text-primary"
        }`}
      >
        <HugeiconsIcon icon={tile.icon} size={22} />
      </motion.span>
      <span className="text-xs font-semibold text-text-primary">
        {tile.label}
      </span>
      {tile.badge !== undefined && tile.badge > 0 && (
        <span className="absolute right-1 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold tabular-nums text-white">
          {tile.badge}
        </span>
      )}
    </>
  );

  if (tile.onSelect) {
    return (
      <button
        type="button"
        onClick={tile.onSelect}
        className="relative flex flex-col items-center gap-1.5 py-1"
      >
        {body}
      </button>
    );
  }
  return (
    <Link
      href={tile.href ?? "#"}
      className="relative flex flex-col items-center gap-1.5 py-1"
    >
      {body}
    </Link>
  );
}

// Bottom sheet for joining with a pasted link — the grid stays a grid of
// one-tap tiles, and the one tile that needs input gets room to breathe.
function JoinSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [invite, setInvite] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <motion.button
        type="button"
        aria-label="Close join with link"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 cursor-default bg-black/40"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Join with an invite link"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="relative w-full max-w-lg rounded-t-[20px] bg-bg px-4 pb-8 pt-2 sm:rounded-[20px] sm:p-6"
      >
        <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-border" />
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-lg font-semibold text-text-primary">
            Join with link
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border-[0.5px] border-border bg-white px-3 py-1.5 text-sm font-semibold text-text-primary"
          >
            Close
          </button>
        </div>
        <form onSubmit={handleJoin} className="flex flex-col gap-2">
          <label
            htmlFor="invite-link"
            className="flex items-center gap-1.5 text-xs text-text-secondary"
          >
            <HugeiconsIcon icon={Link01Icon} size={14} />
            Paste the invite link someone sent you
          </label>
          <input
            id="invite-link"
            value={invite}
            onChange={(e) => {
              setInvite(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste it here"
            autoComplete="off"
            spellCheck={false}
            autoFocus
            className="rounded-[10px] border-[0.5px] border-border bg-white px-4 py-3 text-[16px] text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-primary"
          />
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            className="rounded-[10px] bg-primary px-6 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Continue
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// Icon grid, not a button stack: every actionable path on this dashboard as
// one tap (OPay-style), sitting right under the balance summary. Contextual
// tiles (Pay, Vote) appear only when there is somewhere to go — a dead-end
// tile is worse than none. Money still moves only via PayButton →
// create-charge → Flutterwave, reached through the Pay tile or the attention
// queue.
export default function ActionGrid({ snapshot }: { snapshot: HomeSnapshot }) {
  const [joinOpen, setJoinOpen] = useState(false);
  const votes = snapshot.attention.filter((item) => item.kind === "vote");
  const pendingVotes = votes.reduce((sum, v) => sum + v.pendingCount, 0);

  const tiles: Tile[] = [];
  if (snapshot.makeContributionHref) {
    tiles.push({
      key: "pay",
      label: "Pay",
      href: snapshot.makeContributionHref,
      icon: Wallet01Icon,
      primary: true,
    });
  }
  if (pendingVotes > 0) {
    tiles.push({
      key: "vote",
      label: "Vote",
      href: votes[0].href,
      icon: UserMultipleIcon,
      badge: pendingVotes,
    });
  }
  tiles.push(
    {
      key: "create",
      label: "Create",
      href: "/groups/new",
      icon: Add01Icon,
    },
    {
      key: "join",
      label: "Join",
      onSelect: () => setJoinOpen(true),
      icon: Link01Icon,
    },
    {
      key: "circles",
      label: "Circles",
      href: "/groups",
      icon: UserGroupIcon,
    },
    {
      key: "activity",
      label: "Activity",
      href: "/activity",
      icon: Activity01Icon,
    },
  );

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {tiles.map((tile) => (
          <ActionTile key={tile.key} tile={tile} />
        ))}
      </div>
      <AnimatePresence>
        {joinOpen && <JoinSheet onClose={() => setJoinOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
