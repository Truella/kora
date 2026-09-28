import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import ConfirmingBanner from "../../components/ConfirmingBanner";
import ScheduleGenerator from "../../components/ScheduleGenerator";
import CircleActivity from "../../components/CircleActivity";
import CircleRequests from "../../components/CircleRequests";
import { fetchOverviewRows } from "@/lib/overview-rows";
import { buildOverviewModel } from "@/lib/overview-model";
import { CircleNotFound } from "../../components/overview/CircleNotFound";
import { CircleBanners } from "../../components/overview/CircleBanners";
import { ScheduleState } from "../../components/overview/ScheduleState";
import { TurnEventCards } from "../../components/overview/TurnEventCards";
import { CurrentTurnHero } from "../../components/overview/CurrentTurnHero";
import { UpcomingTurns } from "../../components/overview/UpcomingTurns";

export const metadata = { title: "Circle" };

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Data + derivation live in lib/overview-* — this page only composes.
  // Below-fold sections (Pending requests, Recent activity) fetch for
  // themselves inside CircleRequests / CircleActivity and stream in
  // behind Suspense — the hero above never waits on them.
  const rows = await fetchOverviewRows(supabase, id, user?.id ?? null);
  const model = buildOverviewModel(rows, {
    userId: user?.id ?? null,
    confirming: paid === "1",
  });
  if (!model.found) return <CircleNotFound />;

  const memberId = rows.member?.id ?? null;

  return (
    <div className="flex flex-col gap-5">
      {model.confirming && <ConfirmingBanner groupId={model.groupId} />}

      <CircleBanners
        isCompleted={model.isCompleted}
        overdue={model.overdue}
        dueSoon={model.dueSoon}
      />

      <ScheduleState
        schedule={model.schedule}
        groupId={model.groupId}
        frequency={model.frequency}
      />

      {model.current && (
        <>
          <TurnEventCards groupId={model.groupId} current={model.current} />
          <CurrentTurnHero current={model.current} />
          <UpcomingTurns rows={model.upcoming} />
        </>
      )}

      {model.sync && (
        <ScheduleGenerator
          groupId={model.groupId}
          frequency={model.frequency}
          memberCount={model.sync.memberCount}
          mode="sync"
          newCount={model.sync.newCount}
        />
      )}

      <Suspense
        fallback={
          <div
            aria-hidden
            className="h-32 animate-pulse rounded-[14px] bg-black/[0.05]"
          />
        }
      >
        <CircleRequests
          groupId={id}
          memberId={memberId}
          isCompleted={model.isCompleted}
        />
      </Suspense>

      <Suspense
        fallback={
          <div aria-hidden className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-[14px] bg-black/[0.05]"
              />
            ))}
          </div>
        }
      >
        <CircleActivity groupId={id} memberId={memberId} />
      </Suspense>
    </div>
  );
}
