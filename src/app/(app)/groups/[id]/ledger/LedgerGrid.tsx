import type {
  LedgerBookCell,
  LedgerBookMember,
  LedgerBookMemberTotal,
  LedgerBookPeriod,
  LedgerCellStatus,
} from "./LedgerBook";

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

// The member × turn contribution matrix: members across the top, turns
// down the side, per-member totals in the footer. Pure presentational —
// all data arrives as props from the server page via LedgerBook.
function GridCell({ cell }: { cell: LedgerBookCell }) {
  return (
    <span
      className={`inline-flex min-w-[76px] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${CELL_STYLE[cell.status]}`}
    >
      {CELL_LABEL[cell.status]}
      {cell.isRecipient ? " ★" : ""}
    </span>
  );
}

// The member × turn contribution matrix: members across the top, turns
// down the side, per-member totals in the footer. Pure presentational —
// all data arrives as props from the server page via LedgerBook.
export default function LedgerGrid({
  members,
  periods,
  memberTotals,
  rotationCollectedLabel,
  expectedPerMemberLabel,
}: {
  members: LedgerBookMember[];
  periods: LedgerBookPeriod[];
  memberTotals: LedgerBookMemberTotal[];
  rotationCollectedLabel: string;
  expectedPerMemberLabel: string;
}) {
  return (
    <div className="ledger-scroll max-h-[480px] overflow-auto border border-border">
        <table className="ledger-table w-full min-w-[720px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-20 min-w-[132px] border-r border-b-2 border-border bg-surface px-3 py-2.5 text-left font-display text-[11px] font-semibold text-text-primary">
                Period
              </th>
              {members.map((m) => (
                <th
                  key={m.id}
                  className="sticky top-0 z-20 max-w-[150px] truncate border-b-2 border-l border-border bg-surface px-3 py-2.5 text-left font-display text-[11px] font-semibold text-text-primary"
                  title={m.name}
                >
                  {m.name}
                </th>
              ))}
              <th className="sticky top-0 z-20 border-b-2 border-l border-border bg-surface px-3 py-2.5 text-left font-display text-[11px] font-semibold text-text-primary">
                Receiver
              </th>
              <th className="sticky top-0 z-20 border-b-2 border-l border-border bg-surface px-3 py-2.5 text-right font-display text-[11px] font-semibold text-text-primary">
                Collected
              </th>
              <th className="sticky top-0 z-20 border-b-2 border-l border-border bg-surface px-3 py-2.5 text-left font-display text-[11px] font-semibold text-text-primary">
                Payout
              </th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.cycleNumber}>
                <td className="sticky left-0 z-10 border-r border-b border-border bg-surface px-3 py-3.5">
                  <p className="text-[13px] font-semibold whitespace-nowrap text-text-primary">
                    {p.periodLabel}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] whitespace-nowrap text-text-secondary">
                    {p.dueLabel}
                  </p>
                </td>
                {p.cells.map((c) => (
                  <td
                    key={c.memberId}
                    className="border-b border-l border-border px-2 py-3.5 text-center align-middle"
                  >
                    <GridCell cell={c} />
                  </td>
                ))}
                <td className="max-w-[110px] truncate border-b border-l border-border px-3 py-3.5 text-text-primary">
                  {p.recipientName}
                </td>
                <td className="border-b border-l border-border px-3 py-3.5 text-right whitespace-nowrap tabular-nums text-text-primary">
                  {p.collectedLabel}
                  <span className="block font-mono text-[10px] text-text-secondary">
                    of {p.expectedLabel}
                  </span>
                </td>
                <td className="border-b border-l border-border px-3 py-3.5 whitespace-nowrap capitalize text-text-secondary">
                  {p.payoutStatus}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-bg">
              <td className="sticky bottom-0 left-0 z-10 border-r border-t border-border bg-bg px-3 py-3 align-top text-[13px] font-semibold text-text-primary">
                Total paid
              </td>
              {memberTotals.map((t) => (
                <td key={t.memberId} className="sticky bottom-0 z-10 border-t border-l border-border bg-bg px-2 py-3 align-top">
                  <p className="text-center text-[13px] font-semibold tabular-nums whitespace-nowrap text-text-primary">
                    {t.totalPaidLabel} / {expectedPerMemberLabel}
                  </p>
                </td>
              ))}
              <td className="border-t border-l border-border px-3 py-3" />
              <td className="border-t border-l border-border px-3 py-3 text-right text-[13px] font-semibold tabular-nums text-text-primary">
                {rotationCollectedLabel}
              </td>
              <td className="border-t border-l border-border px-3 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
  );
}
