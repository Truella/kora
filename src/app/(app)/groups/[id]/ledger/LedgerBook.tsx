"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Download04Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { useLedgerLive } from "@/lib/use-ledger-live";

export type LedgerRowStatus = "paid" | "late" | "due" | "upcoming";

export type LedgerPageRow = {
  key: string;
  dateLabel: string;
  memberLabel: string;
  contributionLabel: string | null;
  payoutLabel: string | null;
  status: LedgerRowStatus;
};

export type LedgerCyclePage = {
  cycleNumber: number;
  rangeLabel: string;
  turnLabel: string;
  // Cycle-level state for the turn lists: settled, in flight or upcoming.
  tone: "paid" | "due" | "upcoming";
  rows: LedgerPageRow[];
  collectedLabel: string;
  paidOutLabel: string;
  paidOutDimmed: boolean;
};

function StatusMark({ status }: { status: LedgerRowStatus }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-[#1E7A5F]">
        <HugeiconsIcon icon={Tick01Icon} size={13} />
        Paid
      </span>
    );
  }
  if (status === "late") {
    return (
      <span className="inline-flex rounded-full bg-[#F8EDD9] px-2 py-0.5 font-semibold text-[#8A5F14]">
        Late
      </span>
    );
  }
  if (status === "due") {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-[#C26A12]">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        Due
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-[#A9C3E8] bg-[#F2F6FD] px-2 py-0.5 font-semibold text-[#3E63A6]">
      Upcoming
    </span>
  );
}

function MoneyCell({ value }: { value: string | null }) {
  if (value === null) {
    return <span className="text-text-secondary/50">—</span>;
  }
  return (
    <span className="font-display font-semibold tabular-nums text-text-primary">
      {value}
    </span>
  );
}

// One ruled paper page: turn header, the turn table, a little filler
// ruling, totals footer. The page hugs its content — at full width a fixed
// tall page would be mostly empty ruling.
function CyclePage({
  page,
  onPrev,
  onNext,
}: {
  page: LedgerCyclePage;
  // Sequential turn navigation. Absent in print, where every page renders.
  onPrev?: () => void;
  onNext?: () => void;
}) {
  return (
    <section className="flex min-h-[260px] flex-col rounded-[12px] border border-[#BF9A4E]/60 bg-[#FBF8F1] px-3 py-4 sm:px-5">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-text-primary">
            Turn {page.cycleNumber}
          </p>
          <p className="mt-0.5 truncate text-xs text-text-secondary">
            {page.rangeLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <p className="-rotate-3 border-b-2 border-text-secondary/50 font-handwriting text-[22px] leading-tight text-text-secondary">
            {page.turnLabel}
          </p>
          {(onPrev || onNext) && (
            <span className="ledger-no-print ml-1 inline-flex items-center">
              <button
                type="button"
                onClick={onPrev}
                disabled={!onPrev}
                aria-label="Previous turn"
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/[0.05] disabled:opacity-30"
              >
                <HugeiconsIcon icon={ChevronLeftIcon} size={16} />
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!onNext}
                aria-label="Next turn"
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/[0.05] disabled:opacity-30"
              >
                <HugeiconsIcon icon={ChevronRightIcon} size={16} />
              </button>
            </span>
          )}
        </div>
      </header>

      <table className="mt-3 w-full border-collapse text-[11px] sm:text-xs">
        <thead>
          <tr className="font-mono text-[9px] uppercase tracking-widest text-text-secondary">
            <th className="border-b border-border pb-1.5 pr-1 text-left font-medium">
              Date
            </th>
            <th className="border-b border-border px-1 pb-1.5 text-left font-medium">
              Member
            </th>
            <th className="border-b border-border px-1 pb-1.5 text-right font-medium">
              Contribution
            </th>
            <th className="border-b border-border px-1 pb-1.5 text-right font-medium">
              Payout
            </th>
            <th className="border-b border-border pb-1.5 pl-1 text-left font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {page.rows.map((row) => (
            <tr
              key={row.key}
              className="h-8 border-b border-text-primary/[0.07]"
            >
              <td className="whitespace-nowrap py-1 pr-1 text-text-secondary">
                {row.dateLabel}
              </td>
              <td
                className="max-w-[160px] truncate px-1 py-1 font-medium text-text-primary sm:max-w-[240px]"
                title={row.memberLabel}
              >
                {row.memberLabel}
              </td>
              <td className="whitespace-nowrap px-1 py-1 text-right">
                <MoneyCell value={row.contributionLabel} />
              </td>
              <td className="whitespace-nowrap px-1 py-1 text-right">
                <MoneyCell value={row.payoutLabel} />
              </td>
              <td className="whitespace-nowrap py-1 pl-1">
                <StatusMark status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Filler ruling: same 32px rhythm as the rows above. */}
      <div
        aria-hidden
        className="flex-1"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0 31px, rgba(22,32,29,0.07) 31px 32px)",
        }}
      />

      <footer className="mt-3 flex items-center justify-between gap-2 rounded-[10px] bg-black/[0.04] px-3 py-2 text-[11px] text-text-secondary sm:text-xs">
        <span>
          Total collected{" "}
          <strong className="font-display font-semibold tabular-nums text-text-primary">
            {page.collectedLabel}
          </strong>
        </span>
        <span className={page.paidOutDimmed ? "opacity-60" : ""}>
          {page.paidOutDimmed ? "Payout scheduled " : "Total paid out "}
          <strong className="font-display font-semibold tabular-nums text-text-primary">
            {page.paidOutLabel}
          </strong>
        </span>
      </footer>
    </section>
  );
}

// One compact row per non-current turn: tapping swaps the book page.
function TurnRow({
  page,
  onOpen,
}: {
  page: LedgerCyclePage;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open turn ${page.cycleNumber} in the ledger book`}
      className="flex w-full items-center gap-3 rounded-[10px] border-[0.5px] border-border bg-surface px-3 py-2.5 text-left transition-colors hover:bg-black/[0.04]"
    >
      <span className="shrink-0 text-sm font-semibold text-text-primary">
        Turn {page.cycleNumber}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
        {page.rangeLabel}
      </span>
      <StatusMark status={page.tone} />
      <HugeiconsIcon
        icon={ChevronRightIcon}
        size={16}
        className="shrink-0 text-text-secondary"
      />
    </button>
  );
}

export default function LedgerBook({
  groupId,
  groupName,
  printedLabel,
  pages,
  initialPage,
  currentCycleNumber,
  empty,
}: {
  groupId: string;
  groupName: string;
  printedLabel: string;
  pages: LedgerCyclePage[];
  initialPage: number;
  currentCycleNumber: number | null;
  empty: boolean;
}) {
  function handlePrint() {
    window.print();
  }

  // Live book: any INSERT/UPDATE on contributions/payouts/cycles refreshes
  // the server snapshot, so the pages never sit stale after a payment.
  const router = useRouter();
  const live = useLedgerLive(`ledger-book:${groupId}`, () => {
    router.refresh();
  });

  // Index of the visible page. Steps by one so every cycle gets the
  // front slot. Defaults to the turn in flight.
  const [start, setStart] = useState(() =>
    Math.min(Math.max(initialPage, 0), Math.max(pages.length - 1, 0)),
  );
  const [expanded, setExpanded] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const current = pages[start];

  // Tapping another turn swaps the book page and brings it into view.
  function openTurn(index: number) {
    setStart(index);
    bookRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // The book answers the current turn; every other turn lives in the
  // list below, anchored to the true current turn rather than the page
  // being viewed so the list stays stable while paging.
  const others = pages
    .map((page, index) => ({ page, index }))
    .filter(
      ({ page }) =>
        page.cycleNumber !==
        (currentCycleNumber ?? pages[pages.length - 1]?.cycleNumber),
    );
  const COLLAPSED_COUNT = 4;
  const visibleOthers = expanded
    ? others
    : others.slice(0, COLLAPSED_COUNT);

  return (
    <div>
      <style>{`@media print {
  header, nav, aside { display: none !important; }
  body { background: #fff !important; }
  main { max-width: none !important; padding: 0 !important; }
  .ledger-no-print { display: none !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { size: landscape; margin: 12mm; }
}`}</style>

      {/* Print renders every cycle stacked; the screen shows one spread. */}
      <div className="hidden print:block">
        <p className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">
          Contribution ledger · printed {printedLabel}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold capitalize">
          {groupName}
        </h1>
        <div className="mt-4 flex flex-col gap-4">
          {pages.map((page) => (
            <CyclePage key={page.cycleNumber} page={page} />
          ))}
        </div>
      </div>

      <div className="ledger-no-print mb-3 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            Ledger
          </h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-text-secondary">
            All contributions and payouts for this circle.
            {!empty && (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${live ? "bg-success" : "bg-text-secondary"}`}
                />
                <span className="font-mono text-xs">
                  {live ? "Live" : "Connecting…"}
                </span>
              </span>
            )}
          </p>
        </div>
        {!empty && (
          <button
            type="button"
            onClick={handlePrint}
            aria-label="Download or print ledger"
            title="Download or print"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border-[0.5px] border-border bg-white text-text-primary transition-colors hover:bg-black/[0.04]"
          >
            <HugeiconsIcon icon={Download04Icon} size={20} />
          </button>
        )}
      </div>

      {empty ? (
        <p className="ledger-no-print rounded-[14px] border-[0.5px] border-border bg-surface px-4 py-3 text-sm text-text-secondary print:hidden">
          No rotation yet — the ledger book appears once the organizer
          generates the payout schedule.
        </p>
      ) : (
        current && (
          <>
            <motion.div
              key={start}
              ref={bookRef}
              initial={{ opacity: 0.3, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
              className="ledger-no-print w-full scroll-mt-4 rounded-[20px] bg-hero-bg p-2 shadow-lg sm:p-2.5 print:hidden"
            >
              <CyclePage
                page={current}
                onPrev={
                  start > 0 ? () => setStart(start - 1) : undefined
                }
                onNext={
                  start < pages.length - 1
                    ? () => setStart(start + 1)
                    : undefined
                }
              />
            </motion.div>

            {others.length > 0 && (
              <div className="ledger-no-print mt-8 print:hidden">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="font-display text-sm font-semibold text-text-primary">
                    Previous turns
                  </h2>
                  {others.length > COLLAPSED_COUNT && (
                    <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      className="text-xs font-semibold text-primary hover:text-primary-hover"
                    >
                      {expanded ? "Show less" : "View all →"}
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {visibleOthers.map(({ page, index }) => (
                    <TurnRow
                      key={page.cycleNumber}
                      page={page}
                      onOpen={() => openTurn(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
