import type { OverviewData } from "@/types/circle";

export function CircleBanners({
  isCompleted,
  overdue,
  dueSoon,
}: Pick<OverviewData, "isCompleted" | "overdue" | "dueSoon">) {
  return (
    <>
      {/* Close-out: every member lands here after the last turn, so the
          state is named outright instead of inferred from missing buttons.
          Success wash, never gold — gold is value/status, and this is the
          terminal state, not an amount. */}
      {isCompleted && (
        <div className="rounded-[10px] bg-[#E0ECE9] px-4 py-3">
          <p className="font-display text-sm font-semibold text-text-primary">
            This circle is over — for now.
          </p>
          <p className="mt-0.5 text-sm leading-6 text-[#1E5A4E]">
            Every turn has been collected. Nothing is due, and no new turns
            will open. Your full history is in Recent activity below.
          </p>
        </div>
      )}

      {overdue && (
        <div className="rounded-[10px] bg-[#F3E1E0] px-4 py-3 text-sm text-[#8A2A21]">
          {overdue.count} contribution{overdue.count === 1 ? "" : "s"}{" "}
          overdue. Turn {overdue.firstNumber} was due {overdue.firstDue}. Pay
          now, late payments lower your trust score.
        </div>
      )}
      {dueSoon && (
        <div className="rounded-[10px] bg-[#F8EDD9] px-4 py-3 text-sm text-[#8A5F14]">
          {dueSoon.amountLabel} due {dueSoon.firstDue} (Turn{""}
          {dueSoon.firstNumber})
          {dueSoon.extra > 0
            ? `, plus ${dueSoon.extra} more within 3 days`
            : ""}
          .
        </div>
      )}
    </>
  );
}
