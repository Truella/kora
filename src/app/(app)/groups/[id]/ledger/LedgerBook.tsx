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
  paid: "bg-[#E0ECE9] text-[#1E5A4E]",
  late: "bg-[#F8EDD9] text-[#8A5F14]",
  pending: "bg-[#E4E5E3] text-[#5B645E]",
  overdue: "bg-[#F3E1E0] text-[#8A2A21]",
  skipped: "bg-transparent text-text-secondary/50",
};

const CELL_LABEL: Record<LedgerCellStatus, string> = {
  paid: "Paid",
  late: "Late",
  pending: "Pending",
  overdue: "Overdue",
  skipped: "—",
};

// Whether the turn's receiver actually got the pot — sits under the due
// date in the sticky period cell so every row answers it in one glance.
// The ★ on a pill only names who receives; this says if it happened.
// Light pills, so they read on the dark sheet and on paper alike.
function PayoutMark({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <p className="mt-1 inline-flex items-center rounded-full bg-[#E0ECE9] px-2 py-px font-mono text-[10px] font-medium whitespace-nowrap text-[#1E5A4E]">
        ✓ Paid out
      </p>
    );
  }
  if (status === "failed") {
    return (
      <p className="mt-1 inline-flex items-center rounded-full bg-[#F3E1E0] px-2 py-px font-mono text-[10px] font-medium whitespace-nowrap text-[#8A2A21]">
        Failed
      </p>
    );
  }
  return (
    <p className="mt-0.5 font-mono text-[10px] whitespace-nowrap text-(--led-sub)">
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
    <div className="ledger-sheet">
      <style>{`.ledger-sheet { --led-bg: #0B2624; --led-ink: #FFFFFF; --led-sub: rgba(255,255,255,0.62); --led-line: rgba(255,255,255,0.12); --led-foot: rgba(255,255,255,0.06); --led-sticky: #0B2624; }
.ledger-scroll { scrollbar-width: thin; scrollbar-color: #14524F #F2F4F2; }
.ledger-scroll::-webkit-scrollbar { height: 8px; }
.ledger-scroll::-webkit-scrollbar-track { background: #F2F4F2; border-radius: 999px; }
.ledger-scroll::-webkit-scrollbar-thumb { background: #14524F; border-radius: 999px; border: 2px solid #F2F4F2; }
.ledger-scroll::-webkit-scrollbar-thumb:hover { background: #0E3B39; }`}</style>
      <style>{`@media print {
  header, nav, aside { display: none !important; }
  body { background: #fff !important; }
  main { max-width: none !important; padding: 0 !important; }
  .ledger-no-print { display: none !important; }
  .ledger-sheet { box-shadow: none !important; border: none !important; border-radius: 0 !important; padding: 0 !important; --led-bg: #ffffff; --led-ink: #16201d; --led-sub: #5b645e; --led-line: #dde3df; --led-foot: #F2F4F2; --led-sticky: #ffffff; }
  .ledger-scroll { overflow: visible !important; }
  .ledger-table { font-size: 10px !important; }
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
        <div className="rounded-[20px] bg-(--led-bg) p-2 sm:p-3">
          <div className="ledger-scroll overflow-x-auto pb-2">
            <table className="ledger-table w-full min-w-[560px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 min-w-[132px] border-b border-(--led-line) bg-(--led-sticky) px-3 py-2.5 text-left font-display text-[11px] font-semibold text-(--led-ink)">
                    Period
                  </th>
                  {members.map((m) => (
                    <th
                      key={m.id}
                      className="max-w-[150px] truncate border-b border-(--led-line) px-3 py-2.5 text-left font-display text-[11px] font-semibold text-(--led-ink)"
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
                    <td className="sticky left-0 border-b border-(--led-line) bg-(--led-sticky) px-3 py-2.5">
                      <p className="text-[13px] font-semibold text-(--led-ink)">
                        {p.periodLabel}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] whitespace-nowrap text-(--led-sub)">
                        {p.dueLabel}
                      </p>
                      <PayoutMark status={p.payoutStatus} />
                    </td>
                    {p.cells.map((c) => (
                      <td
                        key={c.memberId}
                        className="border-b border-(--led-line) px-2 py-2.5 text-center align-middle"
                      >
                        <span
                          className={`inline-flex min-w-[76px] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${CELL_STYLE[c.status]}`}
                        >
                          {CELL_LABEL[c.status]}
                          {c.isRecipient ? " ★" : ""}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="sticky left-0 bg-(--led-sticky) px-3 py-3 align-top text-[13px] font-semibold text-(--led-ink)">
                    Total paid
                  </td>
                  {memberTotals.map((t) => (
                    <td
                      key={t.memberId}
                      className="bg-(--led-foot) px-2 py-3 align-top"
                    >
                      <p className="text-center text-[13px] font-semibold tabular-nums text-(--led-ink)">
                        {t.totalPaidLabel}
                      </p>
                      <p className="mt-0.5 text-center font-mono text-[10px] text-(--led-sub)">
                        {t.paid}✓{t.late > 0 ? ` ${t.late} late` : ""}
                        {t.overdue > 0 ? ` ${t.overdue} overdue` : ""}
                        {t.pending > 0 ? ` ${t.pending} pending` : ""}
                      </p>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
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
