import { TurnHero, DueChip, SettledChip } from "../../components/TurnViews";
import { formatCycleDateShort } from "@/lib/money";
import type { CurrentTurnModel } from "@/types/circle";

export function CurrentTurnHero({ current }: { current: CurrentTurnModel }) {
  const { contribution } = current;
  return (
    <div className="flex flex-col gap-4">
      <TurnHero
        anchorId={current.anchorId}
        turnNumber={current.turnNumber}
        chip={
          current.chip.kind === "settled" ? (
            <SettledChip label="✓ Settled" />
          ) : (
            <DueChip label={current.chip.label} />
          )
        }
        positionLine={current.positionLine}
        contributionAmount={current.contributionAmount}
        contributionState={
          contribution.kind === "skipped" ? (
            <p className="text-xs leading-5 text-white/65">
              Ran before you joined. Not yours to pay.
            </p>
          ) : contribution.kind === "paid" ? (
            contribution.late ? (
              <p className="text-xs font-medium text-[#F2B8B5]">
                Paid late. It arrived after the due date, so your trust score
                dropped.
              </p>
            ) : (
              <p className="text-xs font-medium text-white/90">
                ✓ Paid
                {contribution.paidAt
                  ? ` ${formatCycleDateShort(contribution.paidAt)}`
                  : ""}
              </p>
            )
          ) : contribution.kind === "pending-member" ? (
            <p className="text-xs leading-5 text-white/70">
              Pending · due {contribution.due}. Pay from the card above.
            </p>
          ) : (
            <p className="text-xs text-white/65">Due {contribution.due}</p>
          )
        }
        receiverLabel={current.receiver.label}
        receiverAmount={current.receiver.amount}
        receiverHighlight={current.receiver.highlight}
        receiverSub={current.receiver.sub}
        settled={current.settled}
        expected={current.expected}
      />
    </div>
  );
}
