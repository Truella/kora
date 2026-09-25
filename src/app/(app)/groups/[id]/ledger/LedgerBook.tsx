"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { useLedgerLive } from "@/lib/use-ledger-live";

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
  payoutStatus: string;
  expectedCount: number;
  settledCount: number;
  collectedLabel: string;
  expectedLabel: string;
  outstandingLabel: string;
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
  pending: "bg-black/[0.04] text-text-secondary",
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

export default function LedgerBook({
  groupId,
  groupName,
  metaLine,
  shareLabel,
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
  shareLabel: string;
  printedLabel: string;
  summary: LedgerBookSummary;
  members: LedgerBookMember[];
  periods: LedgerBookPeriod[];
  memberTotals: LedgerBookMemberTotal[];
  empty: boolean;
}) {
  function handlePrint() {
    window.print();
  }

  // Live book: any INSERT/UPDATE on contributions/payouts/cycles refreshes
  // the server snapshot, so the grid never sits stale after a payment.
  const router = useRouter();
  const live = useLedgerLive(`ledger-book:${groupId}`, () => {
    router.refresh();
  });

  return (
    <div className="ledger-sheet">
      <style>{`.ledger-scroll { scrollbar-width: thin; scrollbar-color: #14524F #F2F4F2; }
.ledger-scroll::-webkit-scrollbar { height: 8px; }
.ledger-scroll::-webkit-scrollbar-track { background: #F2F4F2; border-radius: 999px; }
.ledger-scroll::-webkit-scrollbar-thumb { background: #14524F; border-radius: 999px; border: 2px solid #F2F4F2; }
.ledger-scroll::-webkit-scrollbar-thumb:hover { background: #0E3B39; }`}</style>
      <style>{`@media print {
  header, nav, aside { display: none !important; }
  body { background: #fff !important; }
  main { max-width: none !important; padding: 0 !important; }
  .ledger-no-print { display: none !important; }
  .ledger-sheet { box-shadow: none !important; border: none !important; border-radius: 0 !important; padding: 0 !important; }
  .ledger-scroll { overflow: visible !important; }
  .ledger-table { font-size: 10px !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { size: landscape; margin: 12mm; }
}`}</style>

      <div className="ledger-no-print mb-3 flex items-center justify-between gap-3">
        <Link
          href={`/groups/${groupId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} /> Back to circle
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          disabled={empty}
          className="rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
        >
          Print / Save PDF
        </button>
      </div>

      <div className="rounded-[20px] border-[0.5px] border-border bg-surface p-5 sm:p-6">
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-text-secondary">
          Contribution ledger
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold capitalize tracking-tight text-text-primary">
          {groupName}
        </h1>
        <p className="mt-1 text-xs leading-5 text-text-secondary">
          {metaLine} · Share {shareLabel} · Printed {printedLabel}
        </p>
        {!empty && (
          <p className="ledger-no-print mt-2 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${live ? "bg-success" : "bg-text-secondary"}`}
            />
            <span className="font-mono text-xs text-text-secondary">
              {live ? "Live" : "Connecting…"}
            </span>
          </p>
        )}

        {empty ? (
          <p className="mt-4 rounded-[10px] bg-black/[0.04] px-4 py-3 text-sm text-text-secondary">
            No rotation yet — the ledger book appears once the organizer
            generates the payout schedule.
          </p>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                ["Expected", summary.rotationExpectedLabel],
                ["Collected", summary.rotationCollectedLabel],
                ["Outstanding", summary.outstandingLabel],
                ["Collection rate", summary.collectionRate],
                ["Payouts done", summary.payoutsCompleted],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[12px] border-[0.5px] border-border bg-bg px-3 py-2"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                    {label}
                  </dt>
                  <dd className="mt-0.5 font-display text-sm font-semibold tabular-nums text-text-primary">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

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

            <div className="ledger-scroll mt-4 overflow-x-auto pb-2">
              <table className="ledger-table w-full min-w-[720px] border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 border border-border bg-surface px-2 py-2 text-left font-display text-[11px] font-semibold text-text-primary">
                      Period
                    </th>
                    {members.map((m) => (
                      <th
                        key={m.id}
                        className="max-w-[110px] truncate border border-border bg-surface px-2 py-2 text-left font-display text-[11px] font-semibold text-text-primary"
                        title={m.name}
                      >
                        {m.name}
                      </th>
                    ))}
                    <th className="border border-border bg-surface px-2 py-2 text-left font-display text-[11px] font-semibold text-text-primary">
                      Receiver
                    </th>
                    <th className="border border-border bg-surface px-2 py-2 text-right font-display text-[11px] font-semibold text-text-primary">
                      Collected
                    </th>
                    <th className="border border-border bg-surface px-2 py-2 text-left font-display text-[11px] font-semibold text-text-primary">
                      Payout
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p) => (
                    <tr key={p.cycleNumber}>
                      <td className="sticky left-0 border border-border bg-surface px-2 py-1.5">
                        <p className="font-semibold text-text-primary">
                          {p.periodLabel}
                        </p>
                        <p className="font-mono text-[10px] text-text-secondary">
                          {p.dueLabel}
                        </p>
                      </td>
                      {p.cells.map((c) => (
                        <td
                          key={c.memberId}
                          className="border border-border px-1.5 py-1.5 text-center"
                        >
                          <span
                            className={`inline-flex min-w-[64px] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${CELL_STYLE[c.status]}`}
                          >
                            {CELL_LABEL[c.status]}
                            {c.isRecipient ? " ★" : ""}
                          </span>
                        </td>
                      ))}
                      <td className="max-w-[110px] truncate border border-border px-2 py-1.5 text-text-primary">
                        {p.recipientName}
                      </td>
                      <td className="whitespace-nowrap border border-border px-2 py-1.5 text-right tabular-nums text-text-primary">
                        {p.collectedLabel}
                        <span className="block font-mono text-[10px] text-text-secondary">
                          of {p.expectedLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap border border-border px-2 py-1.5 capitalize text-text-secondary">
                        {p.payoutStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="sticky left-0 border border-border bg-bg px-2 py-1.5 font-display text-[11px] font-semibold text-text-primary">
                      Total paid
                    </td>
                    {memberTotals.map((t) => (
                      <td
                        key={t.memberId}
                        className="border border-border bg-bg px-2 py-1.5 text-center tabular-nums text-text-primary"
                      >
                        <span className="font-semibold">{t.totalPaidLabel}</span>
                        <span className="block font-mono text-[10px] text-text-secondary">
                          {t.paid}✓{t.late > 0 ? ` ${t.late} late` : ""}
                          {t.overdue > 0 ? ` ${t.overdue} overdue` : ""}
                          {t.pending > 0 ? ` ${t.pending} pending` : ""}
                        </span>
                      </td>
                    ))}
                    <td className="border border-border bg-bg px-2 py-1.5" />
                    <td className="border border-border bg-bg px-2 py-1.5 text-right font-display text-[11px] font-semibold tabular-nums text-text-primary">
                      {summary.rotationCollectedLabel}
                    </td>
                    <td className="border border-border bg-bg px-2 py-1.5" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
