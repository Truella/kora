"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserAdd01Icon,
  Link01Icon,
  Tick01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import InviteByPhone from "./InviteByPhone";
// Shares the grid tile's hover/focus treatment with its three siblings. A
// `<button>`, not an `<a>`, so it reuses the class rather than the component.
import { ACTION_TILE } from "./TurnViews";

// Tab-bar styling for the merged circle header: same pill geometry as the
// sibling Links in CircleTabs (no border, no tile chrome). The dropdown
// panel is `fixed` on mobile so the tab bar's horizontal scroll container
// cannot clip it, and a plain absolute dropdown from `sm` up.
const TAB_BUTTON =
  "flex shrink-0 items-center gap-1.5 rounded-[12px] px-3 py-2 text-[13px] font-medium whitespace-nowrap text-text-secondary transition-colors hover:bg-black/[0.04] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

// The single entry point for inviting. One CTA opens a custom dropdown with
// the two paths side by side: anonymous link (works before an account
// exists) and addressed phone invite (lands on the invitee's home). The
// phone form lives in a bottom sheet — a form crammed into the dropdown
// panel is exactly the mobile jumble this replaces.
//
// ?by= carries the inviter's PROFILE id (join_requests.invited_by FKs to
// profiles; a group_members.id fails the insert).
export default function InviteMenu({
  groupId,
  inviterId,
  grid = false,
  tab = false,
}: {
  groupId: string;
  inviterId: string;
  grid?: boolean;
  tab?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [copied, setCopied] = useState(false);

  // Escape closes the topmost layer first; the sheet locks body scroll.
  useEffect(() => {
    if (!open && !sheet) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (sheet) setSheet(false);
      else setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, sheet]);

  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheet]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/groups/${groupId}/join?by=${inviterId}`,
      );
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1200);
    } catch {
      // Clipboard unavailable — the join page URL is shareable as-is.
      setOpen(false);
    }
  }

  return (
    <>
      <div className={grid ? "relative w-full" : "relative shrink-0"}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className={
            grid
              ? ACTION_TILE
              : "inline-flex items-center gap-2 rounded-[10px] border-[0.5px] border-border bg-white px-4 py-2 text-sm font-semibold text-text-primary"
          }
        >
          <HugeiconsIcon
            icon={UserAdd01Icon}
            size={grid ? 24 : 16}
            className="text-primary"
          />
          <span
            className={
              grid
                ? "text-xs font-semibold text-text-primary"
                : "text-sm font-semibold text-text-primary"
            }
          >
            Invite
          </span>
        </button>

        <AnimatePresence>
          {open && (
            <>
              {/* Outside-click catcher — transparent, sits under the panel. */}
              <button
                type="button"
                aria-label="Close invite options"
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-30 cursor-default bg-transparent"
              />
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-40 mt-2 w-60 rounded-[14px] border-[0.5px] border-border bg-surface p-1.5 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={copyLink}
                  className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-black/[0.04]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10">
                    <HugeiconsIcon
                      icon={copied ? Tick01Icon : Link01Icon}
                      size={18}
                      className="text-primary"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-text-primary">
                      {copied ? "Link copied" : "Copy invite link"}
                    </span>
                    <span className="block truncate text-xs text-text-secondary">
                      Anyone with the link can ask to join
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    setSheet(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-black/[0.04]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10">
                    <HugeiconsIcon
                      icon={UserMultipleIcon}
                      size={18}
                      className="text-primary"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-text-primary">
                      Invite by phone
                    </span>
                    <span className="block truncate text-xs text-text-secondary">
                      They get a nudge on their home
                    </span>
                  </span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {sheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <motion.button
              type="button"
              aria-label="Close phone invite"
              onClick={() => setSheet(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-default bg-black/40"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Invite by phone"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="relative w-full max-w-lg rounded-t-[20px] bg-bg px-4 pb-8 pt-2 sm:rounded-[20px] sm:p-6 min-h-[380px]"
            >
              <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-border" />
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-lg font-semibold text-text-primary">
                  Invite by phone
                </p>
                <button
                  type="button"
                  onClick={() => setSheet(false)}
                  className="rounded-[10px] border-[0.5px] border-border bg-white px-3 py-1.5 text-sm font-semibold text-text-primary"
                >
                  Close
                </button>
              </div>
              <InviteByPhone groupId={groupId} bare />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
