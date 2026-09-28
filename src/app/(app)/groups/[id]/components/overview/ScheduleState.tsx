import ScheduleGenerator from "../../components/ScheduleGenerator";
import type { OverviewSchedule } from "@/types/circle";

export function ScheduleState({
  schedule,
  groupId,
  frequency,
}: {
  schedule: OverviewSchedule;
  groupId: string;
  frequency: string;
}) {
  if (schedule.kind === "ready") return null;
  // A finished circle with no schedule is an organizer-closed edge: the
  // close-out banner already names the state, so neither the generator nor
  // the waiting note renders (model emits `ready` for that case).
  if (schedule.kind === "generate") {
    return (
      <ScheduleGenerator
        groupId={groupId}
        frequency={frequency}
        memberCount={schedule.memberCount}
      />
    );
  }
  return (
    <div className="rounded-[14px] border-[0.5px] border-border bg-surface p-5 text-center">
      <p className="font-display text-lg font-semibold text-text-primary">
        Waiting for schedule
      </p>
      <p className="mt-1 text-sm leading-6 text-text-secondary">
        The payout rotation has not been generated yet. The organizer starts
        it once membership settles.
      </p>
    </div>
  );
}
