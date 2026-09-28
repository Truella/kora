import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import VoteButtons from "./VoteButtons";

const ANCHOR_MT = "scroll-mt-[calc(var(--app-header-h)+1rem)]";

type ApplicantRow = {
  request_id: string;
  applicant_name: string | null;
  applicant_phone: string | null;
  inviter_name: string | null;
  applicant_avatar: string | null;
};

function applicantInitial(name: string | null): string {
  return (name?.trim().charAt(0) || "·").toUpperCase();
}

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
    applicant_avatar: r.applicant_avatar ?? null,
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
            const name = request.applicant_name ?? "Applicant";
            return (
              <li
                key={request.id}
                className="flex flex-col gap-3 rounded-[14px] border-[0.5px] border-border bg-surface p-4"
              >
                <div className="flex items-center gap-3">
                  {request.applicant_avatar ? (
                    <Image
                      src={request.applicant_avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-[15px] font-semibold text-text-secondary"
                    >
                      {applicantInitial(request.applicant_name)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {name}
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
                  <span className="shrink-0 rounded-full bg-black/[0.05] px-2 py-px font-mono text-[11px] font-semibold tabular-nums text-text-secondary">
                    {t.approve} yes · {t.reject} no
                  </span>
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
