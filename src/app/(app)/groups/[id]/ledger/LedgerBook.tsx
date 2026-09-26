"use client";

import { useRouter } from "next/navigation";
import { useLedgerLive } from "@/hooks/use-ledger-live";
import LedgerGrid from "./LedgerGrid";

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
  recipientName: string;
  expectedCount: number;
  settledCount: number;
  collectedLabel: string;
  expectedLabel: string;
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

export default function LedgerBook({
  groupId,
  summary,
  members,
  periods,
  memberTotals,
  expectedPerMemberLabel,
  empty,
}: {
  groupId: string;
  summary: LedgerBookSummary;
  members: LedgerBookMember[];
  periods: LedgerBookPeriod[];
  memberTotals: LedgerBookMemberTotal[];
  expectedPerMemberLabel: string;
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
    <div className="ledger-sheet rounded-[12px] bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,20,0.06),0_8px_24px_-16px_rgba(16,24,20,0.18)] sm:p-6">
      {/* The scroll area uses the app-wide scrollbar from globals.css —
          no local thumb/track overrides. */}
      <style>{`@media print {
  header, nav, aside { display: none !important; }
  body { background: #fff !important; }
  main { max-width: none !important; padding: 0 !important; }
  .ledger-no-print { display: none !important; }
  .ledger-sheet { box-shadow: none !important; border: none !important; border-radius: 0 !important; padding: 0 !important; }
  .ledger-scroll { overflow: visible !important; max-height: none !important; }
  .ledger-table { font-size: 10px !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { size: landscape; margin: 12mm; }
}`}</style>

      {/* Ledger title block: on screen it names the book below the circle
          tabs; in print the header chrome is hidden so this carries the
          title. No Live badge by direction. */}
      <div className="mb-4 print:block">
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-text-secondary">
          Contribution ledger
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
              className={`rounded-[12px] bg-bg px-3 py-2.5 ${label === "Payouts done" ? "hidden sm:block" : ""}`}
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
        <div className="rounded-[12px] bg-bg p-5 sm:p-6">
          <p className="px-4 py-3 text-sm text-text-secondary">
            No rotation yet — the ledger book appears once the organizer
            generates the payout schedule.
          </p>
        </div>
      ) : (
        <LedgerGrid
          members={members}
          periods={periods}
          memberTotals={memberTotals}
          rotationCollectedLabel={summary.rotationCollectedLabel}
          expectedPerMemberLabel={expectedPerMemberLabel}
        />
      )}

      {!empty && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-secondary">
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
          <span>★ receives the pot that turn</span>
        </div>
      )}
    </div>
  );
}
