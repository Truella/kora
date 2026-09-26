"use client";

import { useRouter } from "next/navigation";
import { useLedgerLive } from "@/hooks/use-ledger-live";

export type LedgerCellStatus = "paid" | "late" | "pending" | "overdue" | "skipped";

export type LedgerBookMember = {
  id: string;
  name: string;
  position: number;
};

export type LedgerBookCell = {
  memberId: string;
  status: LedgerCellStatus;
  isRecipient: boolean;
};

export type LedgerBookPeriod = {
  cycleNumber: number;
  periodLabel: string;
  dueLabel: string;
  expectedCount: number;
  settledCount: number;
  payoutStatus: string;
  cells: LedgerBookCell[];
};

export type LedgerBookMemberTotal = {
  memberId: string;
  name: string;
  paid: number;
  late: number;
  pending: number;
  overdue: number;
  totalPaidLabel: string;
};

export type LedgerBookSummary = {
  rotationExpectedLabel: string;
  rotationCollectedLabel: string;
  outstandingLabel: string;
  collectionRate: string;
  payoutsCompleted: string;
};

const CELL_STYLE: Record<LedgerCellStatus, string> = {
  paid: "text-[#205C4D]",
  late: "text-[#9A6B12]",
  pending: "text-[#A39A80]",
  overdue: "text-[#963023]",
  skipped: "text-text-secondary/40",
};

const CELL_ICON: Record<LedgerCellStatus, string> = {
  paid: "✓ ",
  late: "◷ ",
  pending: "○ ",
  overdue: "● ",
  skipped: "",
};

const CELL_LABEL: Record<LedgerCellStatus, string> = {
  paid: "Paid",
  late: "Late",
  pending: "Pending",
  overdue: "Overdue",
  skipped: "—",
};

// Whether the turn's receiver actually got the pot — handwritten ink under
// the due date so every row answers it in one glance. The ★ on a stamp
// only names who receives; this says if it happened.
function PayoutMark({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <p className="mt-0.5 font-handwriting text-[17px] leading-none whitespace-nowrap text-[#205C4D]">
        ✓ paid out
      </p>
    );
  }
  if (status === "failed") {
    return (
      <p className="mt-0.5 font-handwriting text-[17px] leading-none whitespace-nowrap text-[#963023]">
        payout failed
      </p>
    );
  }
  return (
    <p className="mt-0.5 font-mono text-[10px] whitespace-nowrap text-[#A39A80]">
      Payout pending
    </p>
  );
}

export default function LedgerBook({
  groupId,
  groupName,
  metaLine,
  printedLabel,
  summary,
  members,
  periods,
  memberTotals,
  expectedPerMemberLabel,
  currentCycleNumber,
  empty,
}: {
  groupId: string;
  groupName: string;
  metaLine: string;
  printedLabel: string;
  summary: LedgerBookSummary;
  members: LedgerBookMember[];
  periods: LedgerBookPeriod[];
  memberTotals: LedgerBookMemberTotal[];
  expectedPerMemberLabel: string;
  currentCycleNumber: number | null;
  empty: boolean;
}) {
  // Live book: any INSERT/UPDATE on contributions/payouts/cycles refreshes
  // the server snapshot, so the grid never sits stale after a payment.
  // (No visible badge — the header row owns the only chrome here.)
  const router = useRouter();
  useLedgerLive(`ledger-book:${groupId}`, () => {
    router.refresh();
  });

  return (
    <div className="ledger-sheet min-w-0">
      <style>{`.ledger-scroll { scrollbar-width: thin; scrollbar-color: #9AA5A1 #EEF1F0; }
.ledger-scroll::-webkit-scrollbar { height: 8px; }
.ledger-scroll::-webkit-scrollbar-track { background: #EEF1F0; border-radius: 999px; }
.ledger-scroll::-webkit-scrollbar-thumb { background: #9AA5A1; border-radius: 999px; border: 2px solid #EEF1F0; }
.ledger-scroll::-webkit-scrollbar-thumb:hover { background: #6E7A76; }`}</style>
      <style>{`@media print {
  header, nav, aside { display: none !important; }
  body { background: #fff !important; }
  main { max-width: none !important; padding: 0 !important; }
  .ledger-no-print { display: none !important; }
  .ledger-sheet { box-shadow: none !important; border: none !important; border-radius: 0 !important; padding: 0 !important; }
  .ledger-scroll { overflow: visible !important; max-height: none !important; }
  .ledger-table { font-size: 10px !important; }
  .ledger-spiral { display: none !important; }
  .ledger-cover { background: #fff !important; padding: 0 !important; box-shadow: none !important; border: none !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { size: landscape; margin: 12mm; }
}`}</style>

      {/* Print keeps the full title block; on screen the CircleHeader above
          already names the circle, so the sheet starts at the stats. */}
      <div className="hidden print:block">
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-text-secondary">
          Contribution ledger
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold capitalize tracking-tight text-text-primary">
          {groupName}
        </h1>
        <p className="mt-1 text-xs leading-5 text-text-secondary">
          {metaLine} · Printed {printedLabel}
        </p>
      </div>

      {!empty && (
        <dl className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            ["Expected", summary.rotationExpectedLabel],
            ["Collected", summary.rotationCollectedLabel],
            ["Outstanding", summary.outstandingLabel],
            ["Collection rate", summary.collectionRate],
            ["Payouts done", summary.payoutsCompleted],
          ].map(([label, value]) => (
            <div
              key={label}
              // Payouts done lives on desktop only — on mobile the four
              // money cards form a clean 2×2 grid.
              className={`rounded-[12px] border-[0.5px] border-border bg-surface px-3 py-2.5 ${label === "Payouts done" ? "hidden sm:block" : ""}`}
            >
              <dt className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                {label}
              </dt>
              <dd className="mt-1 font-display text-base font-semibold tabular-nums text-text-primary">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {empty ? (
        <div className="rounded-[20px] border-[0.5px] border-border bg-surface p-5 sm:p-6">
          <p className="rounded-[10px] bg-black/[0.04] px-4 py-3 text-sm text-text-secondary">
            No rotation yet — the ledger book appears once the organizer
            generates the payout schedule.
          </p>
        </div>
      ) : (
        <div className="ledger-cover rounded-[20px] bg-[#0C3532] p-2 shadow-[0_1px_2px_rgba(12,53,50,0.3),0_16px_40px_-16px_rgba(12,53,50,0.5)] sm:p-2.5">
          {/* Top coil — the single-page binding. Outside the scroll area so
              the sticky Period column never slides under it. Hidden in print. */}
          <div
            aria-hidden
            className="ledger-spiral flex items-start justify-between overflow-hidden px-5 pt-1"
          >
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="-mb-2 h-[20px] w-[11px] shrink-0 rounded-[5px] border-[2.5px] border-[#C9D1CE] bg-transparent shadow-[0_1px_1px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.25)]"
              />
            ))}
          </div>
          <div className="overflow-hidden rounded-[14px] bg-white">
            <div className="flex items-start justify-between gap-3 px-4 pt-3 sm:px-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-text-secondary">
                Contribution ledger
              </p>
              <p className="-rotate-2 font-handwriting text-[22px] leading-none text-[#1F2E2C]">
                Turns 1–{periods.length}
              </p>
            </div>
          <div className="ledger-scroll max-h-[min(62vh,560px)] overflow-auto bg-white">
            <table className="ledger-table w-full min-w-[560px] border-separate border-spacing-0 text-xs">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-20 min-w-[108px] border-r border-[#E3A9A3]/50 border-b-2 border-b-border bg-white px-2 py-2 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-text-secondary">
                    Period
                  </th>
                  {members.map((m) => (
                    <th
                      key={m.id}
                      className="sticky top-0 z-10 max-w-[150px] truncate border-b-2 border-b-border border-r border-border bg-white px-2 py-2 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-text-secondary"
                      title={m.name}
                    >
                      {m.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((p) => (
                  <tr key={p.cycleNumber}>
                    <td className="sticky left-0 z-[1] border-r border-[#E3A9A3]/50 border-b border-border bg-white px-2 py-1.5">
                      <p className="font-handwriting text-[20px] leading-none whitespace-nowrap text-text-primary">
                        {p.periodLabel}
                      </p>
                      {p.cycleNumber === currentCycleNumber && (
                        <p className="mt-1">
                          <span className="rounded-full border border-[#8A5F14]/30 bg-[#F8EDD9] px-2 py-px font-mono text-[9px] font-medium whitespace-nowrap uppercase tracking-wider text-[#8A5F14]">
                            Current turn
                          </span>
                        </p>
                      )}
                      <p className="mt-1 font-mono text-[10px] whitespace-nowrap text-text-secondary">
                        {p.dueLabel}
                      </p>
                      <PayoutMark status={p.payoutStatus} />
                    </td>
                    {p.cells.map((c) => (
                      <td
                        key={c.memberId}
                        className="border-b border-r border-border px-1.5 py-1.5 text-center align-middle"
                      >
                        <span
                          className={`text-[13px] font-medium whitespace-nowrap ${CELL_STYLE[c.status]}`}
                        >
                          {CELL_ICON[c.status]}
                          {CELL_LABEL[c.status]}
                          {c.isRecipient ? " ★" : ""}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-bg">
                  <td className="sticky bottom-0 left-0 z-20 border-r border-[#E3A9A3]/50 border-t-[3px] border-t-double border-t-border bg-bg px-3 py-3 align-top font-handwriting text-[20px] leading-none text-text-primary">
                    Total paid
                  </td>
                  {memberTotals.map((t) => (
                    <td key={t.memberId} className="sticky bottom-0 z-10 border-t-[3px] border-t-double border-t-border border-r border-border bg-bg px-1.5 py-2 align-top">
                      <p className="text-center text-[13px] font-semibold tabular-nums text-text-primary">
                        {t.totalPaidLabel}
                      </p>
                      <p className="mt-0.5 text-center font-mono text-[10px] whitespace-nowrap text-text-secondary">
                        of {expectedPerMemberLabel}
                      </p>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
          </div>
        </div>
      )}

      {!empty && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-text-secondary">
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#2E7D6E]" />
            Paid
          </span>
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#D9992E]" />
            Late
          </span>
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-black/20" />
            Pending
          </span>
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#B23A2E]" />
            Overdue
          </span>
          <span>★ receives the money saved that turn</span>
        </div>
      )}
    </div>
  );
}
