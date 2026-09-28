"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";

import { JoinCardTrigger } from "./join/JoinCardTrigger";
import { JoinCompactTrigger } from "./join/JoinCompactTrigger";
import { JoinDialog } from "./join/JoinDialog";

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
  const openDialog = () => setOpen(true);
  const closeDialog = () => setOpen(false);

  if (variant === "compact") {
    return (
      <>
        <JoinCompactTrigger
          onOpen={openDialog}
          expanded={open}
          className={className}
        />

        <AnimatePresence>
          {open && <JoinDialog mobileOnly onClose={closeDialog} />}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <JoinCardTrigger onOpen={openDialog} className={className} />

      <AnimatePresence>
        {open && <JoinDialog onClose={closeDialog} />}
      </AnimatePresence>
    </>
  );
}
