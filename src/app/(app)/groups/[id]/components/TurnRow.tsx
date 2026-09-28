import type { ReactNode } from "react";
import { RevealLi } from "@/components/Reveal";
import { ANCHOR_MT } from "@/constants/circle";

// Compressed rows for the upcoming turns. Keeps the `cycle-<id>` anchor so
// /home attention deep-links land.
//
// Upcoming only. Completed turns are not listed: `LedgerFeed` on the detail
// page, `/activity` and the home activity strip already carry every settled
// contribution and payout with its turn number and date, so a "Previous
// turns" list was a second copy of the same ledger in a layout that said it
// worse. The rows themselves are untouched in the database — the detail page
// just stopped re-telling them.
//
// No per-row state chip either. The section is already headed "Upcoming
// turns", so an "Upcoming" pill on every row repeated its own container. The
// share line is the only per-turn state here, and it is the caller's own.
export function TurnRow({
  anchorId,
  turnNumber,
  meta,
  shareLine,
  action,
  delay = 0.05,
}: {
  anchorId: string;
  turnNumber: number;
  meta: ReactNode;
  shareLine: ReactNode;
  action?: ReactNode;
  delay?: number;
}) {
  return (
    <RevealLi
      id={anchorId}
      delay={delay}
      className={`${ANCHOR_MT} flex flex-col gap-2 rounded-[14px] border-[0.5px] border-border bg-surface p-4`}
    >
      <div className="min-w-0">
        <p className="font-display text-base font-semibold text-text-primary">
          Turn {turnNumber}
        </p>
        <p className="mt-0.5 text-xs tabular-nums leading-5 text-text-secondary">
          {meta}
        </p>
      </div>
      <div className="border-t border-border pt-2.5 text-xs leading-5 text-text-secondary">
        {shareLine}
      </div>
      {action}
    </RevealLi>
  );
}
