import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemberRow } from "@/app/(app)/groups/[id]/components/TurnViews";

// Member-row derivation for the circle members tab. Read-only: every query
// below is already covered by the existing RLS policies. Shared by the
// server render and the /api/members refetch so the two cannot drift.

type CircleMemberRow = {
  id: string;
  user_id: string;
  invited_by: string | null;
  trust_score_cache: number | string;
  payout_position: number | null;
  joined_at: string;
};

export async function getMemberRows(
  supabase: SupabaseClient,
  groupId: string,
  opts: { createdBy: string; viewerUserId: string | null },
): Promise<MemberRow[]> {
  const { data: circleMembers } = await supabase
    .from("group_members")
    .select(
      "id, user_id, invited_by, trust_score_cache, payout_position, joined_at",
    )
    .eq("group_id", groupId)
    .eq("status", "active")
    .order("payout_position", { ascending: true });
  const circleRows = (circleMembers ?? []) as CircleMemberRow[];

  let profileNames = new Map<string, string>();
  let profileAvatars = new Map<string, string>();
  if (circleRows.length > 0) {
    const needIds = [
      ...new Set([
        ...circleRows.map((m) => m.user_id),
        ...circleRows
          .map((m) => m.invited_by)
          .filter((v): v is string => v !== null),
      ]),
    ];
    const { data: mprofs } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", needIds);
    const profRows = (mprofs ?? []) as {
      id: string;
      full_name: string;
      avatar_url: string | null;
    }[];
    profileNames = new Map(profRows.map((p) => [p.id, p.full_name]));
    profileAvatars = new Map(
      profRows
        .filter((p) => p.avatar_url)
        .map((p) => [p.id, p.avatar_url as string]),
    );
  }

  const { data: cycles } = await supabase
    .from("cycles")
    .select("id, cycle_number, status, recipient_member_id")
    .eq("group_id", groupId)
    .order("cycle_number", { ascending: true });
  const sortedCycles = [...(cycles ?? [])].sort(
    (a, b) => a.cycle_number - b.cycle_number,
  );
  const currentCycle =
    sortedCycles.find((c) => c.status !== "completed") ??
    sortedCycles[sortedCycles.length - 1] ??
    null;
  const currentIdx = currentCycle
    ? sortedCycles.findIndex((c) => c.id === currentCycle.id)
    : -1;
  const nextRecipientId =
    currentIdx >= 0 && currentIdx + 1 < sortedCycles.length
      ? sortedCycles[currentIdx + 1].recipient_member_id
      : null;

  const cycleIds = sortedCycles.map((c) => c.id);
  const { data: currentContributions } =
    currentCycle && cycleIds.length > 0
      ? await supabase
          .from("contributions")
          .select("member_id, status")
          .eq("cycle_id", currentCycle.id)
      : { data: [] };
  const settledByMember = new Map(
    (
      (currentContributions ?? []) as {
        member_id: string;
        status: string;
      }[]
    ).map((r) => [r.member_id, r.status]),
  );

  const { data: settledRows } =
    cycleIds.length > 0
      ? await supabase
          .from("contributions")
          .select("member_id")
          .in("cycle_id", cycleIds)
          .in("status", ["paid", "late"])
      : { data: [] };
  const settledMemberIds = new Set(
    ((settledRows ?? []) as { member_id: string }[]).map((r) => r.member_id),
  );

  return circleRows.map((m, i) => {
    const name = profileNames.get(m.user_id) ?? `····${m.user_id.slice(-4)}`;
    const isFounder = m.user_id === opts.createdBy;
    const inviter = m.invited_by ? profileNames.get(m.invited_by) : null;
    const role = isFounder
      ? "Founder"
      : m.invited_by
        ? `Invited by ${inviter ?? "a member"}`
        : "Joined via link";
    const raw = currentCycle ? (settledByMember.get(m.id) ?? "pending") : null;
    const share =
      raw === "paid"
        ? ("paid" as const)
        : raw === "late"
          ? ("late" as const)
          : raw
            ? ("pending" as const)
            : null;
    const score = Number(m.trust_score_cache);
    return {
      id: m.id,
      initial: (name.trim().charAt(0) || "·").toUpperCase(),
      name,
      avatarUrl: profileAvatars.get(m.user_id) ?? null,
      you: !!opts.viewerUserId && m.user_id === opts.viewerUserId,
      next: m.id === nextRecipientId,
      role,
      slot: m.payout_position ?? i + 1,
      share,
      trust: settledMemberIds.has(m.id)
        ? Number.isFinite(score)
          ? score
          : 100
        : null,
    };
  });
}
