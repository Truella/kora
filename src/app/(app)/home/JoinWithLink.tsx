"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

function extractGroupId(raw: string): string | null {
  const match = new RegExp(`/groups/(${UUID})(?:/join)?`, "i").exec(
    raw.trim(),
  );
  if (match) return match[1].toLowerCase();
  const bare = new RegExp(`^(${UUID})$`, "i").exec(raw.trim());
  return bare ? bare[1].toLowerCase() : null;
}

// The one home action that is not already represented by Create, the circle
// cards, or global navigation. It keeps the useful join-link flow from the
// remote action grid without restoring four duplicate/dead tiles.
export default function JoinWithLink() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-[16px] border-[0.5px] border-border bg-surface px-4 py-3.5 text-left shadow-[0_8px_22px_rgba(11,38,36,0.04)] transition-[transform,border-color] duration-150 ease-out hover:border-primary/20 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-black/[0.035] text-primary">
          <HugeiconsIcon icon={Link01Icon} size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-text-primary">
            Join with a link
          </span>
          <span className="mt-0.5 block text-xs text-text-secondary">
            Paste an invite someone sent you
          </span>
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={16}
          className="shrink-0 text-text-secondary"
        />
      </button>

      <AnimatePresence>
        {open && <JoinSheet onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function JoinSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [invite, setInvite] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
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
            className="rounded-[10px] border-[0.5px] border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text-primary"
          >
            Close
          </button>
        </div>
        <form onSubmit={handleJoin} className="flex flex-col gap-2">
          <label
            htmlFor="home-invite-link"
            className="flex items-center gap-1.5 text-xs text-text-secondary"
          >
            <HugeiconsIcon icon={Link01Icon} size={14} />
            Paste the invite link someone sent you
          </label>
          <input
            id="home-invite-link"
            value={invite}
            onChange={(event) => {
              setInvite(event.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste it here"
            autoComplete="off"
            spellCheck={false}
            autoFocus
            className="rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-3 text-[16px] text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-primary"
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
