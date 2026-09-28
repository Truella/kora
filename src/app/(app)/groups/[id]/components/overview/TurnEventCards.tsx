import PayButton from "../../components/PayButton";
import PayoutAction from "../../components/PayoutAction";
import { EventCard } from "../../components/TurnViews";
import type { CurrentTurnModel } from "@/types/circle";

// Event cards: the hero states what is, these say what needs you.
// Pay-my-share and confirm-my-payout live here — never as rows inside
// the turn card.
export function TurnEventCards({
  groupId,
  current,
}: {
  groupId: string;
  current: CurrentTurnModel;
}) {
  return (
    <>
      {current.contributionDue && (
        <EventCard
          tone="gold"
          eyebrow="Contribution due"
          title={
            <>
              Your {current.contributionDue.amount} share · Turn{" "}
              {current.contributionDue.turnNumber}
            </>
          }
          sub={
            <>
              Due {current.contributionDue.due}. Pay now, late payments lower
              your trust score.
            </>
          }
          action={
            <PayButton
              cycleId={current.cycleId}
              groupId={groupId}
              amountLabel={current.contributionDue.amount}
            />
          }
        />
      )}
      {current.payoutReady && (
        <EventCard
          tone="teal"
          eyebrow="Everyone has paid"
          title={
            <>
              Turn {current.payoutReady.turnNumber}:{" "}
              {current.payoutReady.pot ?? "The money"} is ready for you.
            </>
          }
          sub="Everyone has paid. Confirm that you collected the money to complete this turn."
          action={
            <div className="flex justify-end">
              <PayoutAction cycleId={current.cycleId} payoutStatus="pending" />
            </div>
          }
        />
      )}
    </>
  );
}
