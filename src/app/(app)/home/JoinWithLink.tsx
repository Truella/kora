"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Link, Link2, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
} from "@/components/ui/morphing-popover";
import { resolveInviteLink } from "@/lib/invite-link";
import { cn } from "@/lib/utils";

const POPOVER_VARIANTS = {
  initial: { opacity: 0, filter: "blur(8px)", scale: 0.98, y: -4 },
  animate: { opacity: 1, filter: "blur(0px)", scale: 1, y: 0 },
  exit: { opacity: 0, filter: "blur(6px)", scale: 0.985, y: -2 },
};

const POPOVER_TRANSITION = {
  duration: 0.25,
  ease: "easeOut",
} as const;

// One join-link flow with two responsive presentations: a morphing popover on
// tablet/desktop (button morphs into the panel anchored at its own top-right,
// so it expands in place) and a full-width bottom sheet on mobile.
export default function JoinWithLink({
  variant = "card",
  className,
}: {
  variant?: "card" | "compact";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const compact = variant === "compact";

  if (compact) {
    return (
      <>
        <MorphingPopover
          className="hidden md:flex"
          transition={POPOVER_TRANSITION}
          variants={POPOVER_VARIANTS}
        >
          <MorphingPopoverTrigger asChild>
            <button
              type="button"
              aria-label="Join a circle with an invite link"
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  className: cn(
                    "group mb-0.5 h-11 gap-2.5 rounded-[14px] bg-surface px-3 font-semibold text-text-primary shadow-[0_6px_18px_rgba(11,38,36,0.045)] hover:bg-surface hover:shadow-[0_8px_22px_rgba(11,38,36,0.07)]",
                    className,
                  ),
                }),
              )}
            >
              <Link
                aria-hidden
                className="shrink-0 text-text-secondary transition-colors duration-150 ease-out group-hover:text-primary"
                size={16}
                strokeWidth={1.9}
              />
              <span className="text-[13px] tracking-[-0.01em]">
                Join a circle
              </span>
            </button>
          </MorphingPopoverTrigger>

          <MorphingPopoverContent
            aria-describedby="desktop-join-popover-description"
            aria-labelledby="desktop-join-popover-title"
            className="right-0 top-0 w-[min(390px,calc(100vw-2rem))] origin-top-right p-0"
          >
            <div className="p-5">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                  Join a circle
                </p>
                <h2
                  id="desktop-join-popover-title"
                  className="mt-1.5 font-display text-xl font-semibold tracking-[-0.02em] text-text-primary"
                >
                  Paste your invite link
                </h2>
                <p
                  id="desktop-join-popover-description"
                  className="mt-1 text-sm leading-5 text-text-secondary"
                >
                  We&apos;ll take you straight to the circle.
                </p>
              </div>

              <JoinLinkForm
                autoFocus
                id="desktop-home-invite-link"
                className="mt-4"
              />
            </div>
          </MorphingPopoverContent>
        </MorphingPopover>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(true)}
          aria-label="Join a circle with an invite link"
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "mb-0.5 h-11 gap-2.5 rounded-[14px] bg-surface px-3 font-semibold text-text-primary shadow-[0_6px_18px_rgba(11,38,36,0.045)] hover:bg-surface hover:shadow-[0_8px_22px_rgba(11,38,36,0.07)] md:hidden",
            className,
          )}
        >
          <Link aria-hidden size={16} strokeWidth={1.9} />
          <span className="sm:hidden">Join</span>
          <span className="hidden sm:inline">Join a circle</span>
        </Button>

        <AnimatePresence>
          {open && <JoinDialog mobileOnly onClose={() => setOpen(false)} />}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "h-auto w-full items-start justify-start gap-3 rounded-[16px] p-4 text-left",
          className,
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-black/[0.035] text-primary">
          <Link2 aria-hidden size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-text-primary">
            Join with a link
          </span>
          <span className="mt-0.5 block text-xs font-normal text-text-secondary">
            Paste an invite someone sent you
          </span>
        </span>
        <ArrowRight
          aria-hidden
          className="mt-3 shrink-0 text-text-secondary"
          size={16}
        />
      </Button>

      <AnimatePresence>
        {open && <JoinDialog onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function JoinLinkForm({
  autoFocus = false,
  className,
  id,
}: {
  autoFocus?: boolean;
  className?: string;
  id: string;
}) {
  const router = useRouter();
  const [invite, setInvite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const href = resolveInviteLink(invite);

    if (!href) {
      setError("That doesn't look like an invite link. Paste the full link.");
      return;
    }

    router.push(href);
  }

  return (
    <form
      onSubmit={handleJoin}
      className={cn("flex flex-col gap-3", className)}
    >
      <Label htmlFor={id} className="sr-only">
        Invite link
      </Label>
      <div className="relative">
        <Link2
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
          size={16}
        />
        <Input
          id={id}
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
            error ? `${descriptionId} ${errorId}` : descriptionId
          }
          autoFocus={autoFocus}
          className="h-12 bg-bg pl-10 text-[16px] focus-visible:ring-primary/10"
        />
      </div>

      <p id={descriptionId} className="sr-only">
        Paste the invite link someone sent you.
      </p>
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="mt-1 w-full rounded-[12px] py-3"
      >
        Open invite
      </Button>
    </form>
  );
}

function JoinDialog({
  mobileOnly = false,
  onClose,
}: {
  mobileOnly?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center",
        mobileOnly ? "md:hidden" : "sm:items-center sm:p-6",
      )}
    >
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
        aria-labelledby="join-dialog-title"
        aria-describedby="join-dialog-description"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.985 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          "relative w-full rounded-t-[24px] bg-surface px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_24px_80px_rgba(11,38,36,0.22)]",
          !mobileOnly &&
            "sm:max-w-[440px] sm:rounded-[24px] sm:px-6 sm:pb-7 sm:pt-6",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "mx-auto mb-4 block h-1 w-10 rounded-full bg-border",
            !mobileOnly && "sm:hidden",
          )}
        />

        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="join-dialog-title"
              className="font-display text-xl font-semibold tracking-[-0.02em] text-text-primary"
            >
              Join a circle
            </h2>
            <p
              id="join-dialog-description"
              className="mt-1 text-sm leading-5 text-text-secondary"
            >
              Paste the invite link someone sent you.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
            className="h-9 w-9 shrink-0 rounded-full text-text-secondary hover:bg-black/[0.05] hover:text-text-primary"
          >
            <X aria-hidden size={17} />
          </Button>
        </div>

        <JoinLinkForm autoFocus id="mobile-home-invite-link" />
      </motion.div>
    </div>
  );
}
