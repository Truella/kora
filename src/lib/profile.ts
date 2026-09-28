// Profile page data: identity, verification state, and the per-circle
// trust list. Moved verbatim from the profile page so the page is fetch,
// build, render.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileData } from "@/types/profile";

// Initials for the avatar fallback — first letters of the first two words.
export function initials(name: string | null | undefined): string | null {
  if (!name) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[1]?.[0] ?? "") : "";
  const out = `${first}${second}`.toUpperCase();
  return out || null;
}

export async function loadProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string | null,
): Promise<ProfileData> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, phone_verified, avatar_url")
    .eq("id", userId)
    .single();

  const verified = profile?.phone_verified ?? false;

  // Per-circle trust (Day 5A). trust_score_cache lives on the membership
  // row, so this is a per-circle list — never a cross-circle average.
  // RLS ("view members of your groups" + "view groups you belong to")
  // scopes both reads to the caller's own circles.
  type MyMembership = {
    id: string;
    group_id: string;
    trust_score_cache: number | string;
  };
  const { data: memberships } = await supabase
    .from("group_members")
    .select("id, group_id, trust_score_cache")
    .eq("user_id", userId)
    .eq("status", "active");
  const myRows = (memberships ?? []) as MyMembership[];
  const scoreByGroup = new Map(
    myRows.map((m) => [m.group_id, Number(m.trust_score_cache)]),
  );
  // On-time/late record behind each score: settled contributions on the
  // caller's own membership rows. Missing/pending rows are not trust events.
  const recordByGroup = new Map<string, { onTime: number; late: number }>();
  if (myRows.length > 0) {
    const { data: settledMine } = await supabase
      .from("contributions")
      .select("member_id, status")
      .in(
        "member_id",
        myRows.map((m) => m.id),
      )
      .in("status", ["paid", "late"]);
    const memberToGroup = new Map(myRows.map((m) => [m.id, m.group_id]));
    for (const row of (settledMine ?? []) as {
      member_id: string;
      status: string;
    }[]) {
      const gid = memberToGroup.get(row.member_id);
      if (!gid) continue;
      const t = recordByGroup.get(gid) ?? { onTime: 0, late: 0 };
      if (row.status === "late") t.late += 1;
      else t.onTime += 1;
      recordByGroup.set(gid, t);
    }
  }
  const circleIds = [...scoreByGroup.keys()];
  const { data: circles } =
    circleIds.length > 0
      ? await supabase
          .from("groups")
          .select("id, name")
          .in("id", circleIds)
          .order("name", { ascending: true })
      : { data: [] };
  const myCircles = (circles ?? []) as { id: string; name: string }[];

  let totalOnTime = 0;
  let totalLate = 0;
  for (const r of recordByGroup.values()) {
    totalOnTime += r.onTime;
    totalLate += r.late;
  }

  const trustCircles = myCircles.map((g) => {
    const score = scoreByGroup.get(g.id);
    const record = recordByGroup.get(g.id);
    const settledTotal = (record?.onTime ?? 0) + (record?.late ?? 0);
    return {
      id: g.id,
      name: g.name,
      recordDetail:
        settledTotal === 0
          ? "No payments yet"
          : `${record?.onTime ?? 0} on-time · ${record?.late ?? 0} late`,
      trust:
        score !== undefined && Number.isFinite(score) ? score : 100,
    };
  });

  return {
    displayName: profile?.full_name || "Your profile",
    phone: profile?.phone ?? null,
    verified,
    email,
    avatarUrl: profile?.avatar_url ?? null,
    fallbackInitials: initials(profile?.full_name),
    userId,
    currentName: profile?.full_name ?? "",
    circleCount: myCircles.length,
    totalOnTime,
    totalLate,
    trustCircles,
  };
}
