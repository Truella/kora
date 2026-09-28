"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { JoinLinkForm } from "./JoinLinkForm";

export function JoinDialog({
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
