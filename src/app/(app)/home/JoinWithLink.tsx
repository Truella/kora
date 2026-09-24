"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Cancel01Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons";
import { resolveInviteLink } from "@/lib/invite-link";

// One join-link flow, two placements: a full card for the empty home and a
// compact header action for a populated dashboard. The action owns the modal,
// so moving it does not duplicate routing or validation.
export default function JoinWithLink({
  variant = "card",
}: {
  variant?: "card" | "compact";
}) {
  const [open, setOpen] = useState(false);
  const compact = variant === "compact";

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Join a circle with an invite link"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="group mb-0.5 flex h-11 cursor-pointer items-center gap-2.5 rounded-[14px] bg-surface px-2.5 pr-3.5 shadow-[0_6px_18px_rgba(11,38,36,0.045)] transition-[transform,box-shadow] duration-150 ease-out hover:shadow-[0_8px_22px_rgba(11,38,36,0.07)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <HugeiconsIcon
            icon={Link01Icon}
            size={16}
            strokeWidth={1.9}
            className="shrink-0 text-text-secondary transition-colors duration-150 ease-out group-hover:text-primary"
          />
          <span className="text-[13px] font-semibold tracking-[-0.01em] text-text-primary">
            Join<span className="hidden sm:inline"> a circle</span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full cursor-pointer items-center gap-3 rounded-[16px] border-[0.5px] border-border bg-surface px-4 py-3.5 text-left shadow-[0_8px_22px_rgba(11,38,36,0.04)] transition-[transform,border-color] duration-150 ease-out hover:border-primary/20 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
      )}

      <AnimatePresence>
        {open && <JoinDialog onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function JoinDialog({ onClose }: { onClose: () => void }) {
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
    const href = resolveInviteLink(invite);
    if (!href) {
      setError("That doesn't look like an invite link. Paste the full link.");
      return;
    }
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <motion.button
        type="button"
        aria-label="Close join with link dialog"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="absolute inset-0 cursor-default bg-[#0B2624]/50 backdrop-blur-[2px]"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-sheet-title"
        aria-describedby="join-sheet-description"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.985 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full max-w-[440px] rounded-t-[24px] bg-surface px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_24px_80px_rgba(11,38,36,0.22)] sm:rounded-[24px] sm:px-6 sm:pb-7 sm:pt-6"
      >
        <span
          aria-hidden
          className="mx-auto mb-4 block h-1 w-10 rounded-full bg-border sm:hidden"
        />

        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="join-sheet-title"
              className="font-display text-xl font-semibold tracking-[-0.02em] text-text-primary"
            >
              Join a circle
            </h2>
            <p
              id="join-sheet-description"
              className="mt-1 text-sm leading-5 text-text-secondary"
            >
              Paste the invite link someone sent you.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors duration-150 ease-out hover:bg-black/[0.05] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.96]"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={17} />
          </button>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <label htmlFor="home-invite-link" className="sr-only">
            Invite link
          </label>
          <div className="relative">
            <HugeiconsIcon
              icon={Link01Icon}
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              id="home-invite-link"
              value={invite}
              onChange={(event) => {
                setInvite(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste invite link"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="url"
              aria-invalid={Boolean(error)}
              aria-describedby={
                error
                  ? "join-sheet-description join-sheet-error"
                  : "join-sheet-description"
              }
              autoFocus
              className="h-12 w-full rounded-[12px] border-[0.5px] border-border bg-bg pl-10 pr-4 text-[16px] text-text-primary outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-text-secondary/55 focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,59,57,0.10)]"
            />
          </div>

          {error && (
            <p
              id="join-sheet-error"
              role="alert"
              className="text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="mt-1 w-full cursor-pointer rounded-[12px] bg-primary px-5 py-3 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Open invite
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
