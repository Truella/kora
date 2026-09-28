import { Link } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
} from "@/components/ui/morphing-popover";
import { cn } from "@/lib/utils";
import { JoinLinkForm } from "./JoinLinkForm";

const POPOVER_VARIANTS = {
  initial: { opacity: 0, filter: "blur(8px)", scale: 0.98, y: -4 },
  animate: { opacity: 1, filter: "blur(0px)", scale: 1, y: 0 },
  exit: { opacity: 0, filter: "blur(6px)", scale: 0.985, y: -2 },
};

const POPOVER_TRANSITION = {
  duration: 0.25,
  ease: "easeOut",
} as const;

// Compact presentation: a morphing popover on tablet/desktop (button morphs
// into the panel anchored at its own top-right, so it expands in place) and
// a button opening the full-width bottom sheet on mobile.
export function JoinCompactTrigger({
  onOpen,
  expanded,
  className,
}: {
  onOpen: () => void;
  expanded: boolean;
  className?: string;
}) {
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
        onClick={onOpen}
        aria-label="Join a circle with an invite link"
        aria-haspopup="dialog"
        aria-expanded={expanded}
        className={cn(
          "mb-0.5 h-11 gap-2.5 rounded-[14px] bg-surface px-3 font-semibold text-text-primary shadow-[0_6px_18px_rgba(11,38,36,0.045)] hover:bg-surface hover:shadow-[0_8px_22px_rgba(11,38,36,0.07)] md:hidden",
          className,
        )}
      >
        <Link aria-hidden size={16} strokeWidth={1.9} />
        <span className="sm:hidden">Join</span>
        <span className="hidden sm:inline">Join a circle</span>
      </Button>
    </>
  );
}
