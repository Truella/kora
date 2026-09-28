import { createClient } from "@/lib/supabase/server";
import CircleRequestsLive, {
  type PendingRequest,
  type VoteTally,
} from "./CircleRequestsLive";

type ApplicantRow = {
  request_id: string;
  applicant_name: string | null;
  applicant_phone: string | null;
  inviter_name: string | null;
  applicant_avatar: string | null;
};

// Server snapshot provider — the live wrapper below owns realtime merging,
// so this stays a thin fetch-and-pass-through.
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
  const requests: PendingRequest[] = ((applicantRows ?? []) as ApplicantRow[]).map(
    (r) => ({
      id: r.request_id,
      applicant_name: r.applicant_name,
      applicant_phone: r.applicant_phone,
      inviter_name: r.inviter_name,
      applicant_avatar: r.applicant_avatar ?? null,
    }),
  );

  const tally: VoteTally = {};
  if (requests.length > 0) {    const { data: votes } = await supabase
      .from("join_votes")
      .select("join_request_id, vote")
      .in(
        "join_request_id",
        requests.map((r) => r.id),
      );
    for (const v of (votes ?? []) as Array<{
      join_request_id: string;
      vote: string;
    }>) {
      const t = tally[v.join_request_id] ?? { approve: 0, reject: 0 };
      if (v.vote === "approve") t.approve += 1;
      else t.reject += 1;
      tally[v.join_request_id] = t;
    }
  }

  // Always mounted — the wrapper renders null when empty but keeps its
  // subscription, so the first application appears without navigation.
  return (
    <CircleRequestsLive
      groupId={groupId}
      memberId={memberId}
      isCompleted={isCompleted}
      initialRequests={requests}
      initialTally={tally}
    />
  );
}
