import { createClient } from "@/lib/supabase/server";
import VoteButtons from "./VoteButtons";

const ANCHOR_MT = "scroll-mt-[calc(var(--app-header-h)+1rem)]";

type ApplicantRow = {
  request_id: string;
  applicant_name: string | null;
  applicant_phone: string | null;
  inviter_name: string | null;
};

export default async function CircleRequests({
  groupId,
  memberId,
  isCompleted,
}: {
  groupId: string;
  memberId: string | null;
  isCompleted: boolean;
}) {
  if (!memberId) return null;
  const supabase = await createClient();
  const { data: applicantRows } = await supabase.rpc("pending_applicants", {
    p_group_id: groupId,
  });
  const requests = ((applicantRows ?? []) as ApplicantRow[]).map((r) => ({
    id: r.request_id,
    applicant_name: r.applicant_name,
    applicant_phone: r.applicant_phone,
    inviter_name: r.inviter_name,
  }));
  if (requests.length === 0) return null;

  const { data: votes } = await supabase
    .from("join_votes")
    .select("join_request_id, vote")
    .in(
      "join_request_id",
      requests.map((r) => r.id),
    );

  const tally = new Map<string, { approve: number; reject: number }>();
  for (const v of votes ?? []) {
    const t = tally.get(v.join_request_id) ?? { approve: 0, reject: 0 };
    if (v.vote === "approve") t.approve += 1;
    else t.reject += 1;
    tally.set(v.join_request_id, t);
  }

  return (
    <section
      id="pending-requests"
      className={`${ANCHOR_MT} flex flex-col gap-3`}
    >
      <h2 className="font-display text-lg font-semibold text-text-primary">
        Pending requests
      </h2>
      {isCompleted ? (
        <p className="rounded-[14px] border-[0.5px] border-border bg-surface p-4 text-xs leading-5 text-text-secondary">
          The circle is over, so voting is paused. Nobody new can join a
          finished circle — these requests stay pending.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => {
            const t = tally.get(request.id) ?? { approve: 0, reject: 0 };
            return (
              <li
                key={request.id}
                className="flex flex-col gap-3 rounded-[14px] border-[0.5px] border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {request.applicant_name ?? "Applicant"}
                    </p>
                    {request.applicant_phone && (
                      <p className="font-mono text-xs tabular-nums text-text-secondary">
                        {request.applicant_phone}
                      </p>
                    )}
                    <p className="text-xs text-text-secondary">
                      {request.inviter_name
                        ? `Invited by ${request.inviter_name}`
                        : "Joined via link"}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-xs tabular-nums text-text-secondary">
                    {t.approve} yes · {t.reject} no
                  </p>
                </div>
                <VoteButtons joinRequestId={request.id} memberId={memberId} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
