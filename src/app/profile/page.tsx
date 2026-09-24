import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, ShieldCheckIcon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";
import { RevealLi } from "../Reveal";
import AvatarUploader from "./AvatarUploader";
import SignOutButton from "./signout-button";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, phone, phone_verified, avatar_url")
        .eq("id", user.id)
        .single()
    : { data: null };

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
  const { data: memberships } = user
    ? await supabase
        .from("group_members")
        .select("id, group_id, trust_score_cache")
        .eq("user_id", user.id)
        .eq("status", "active")
    : { data: [] };
  const myRows = (memberships ?? []) as MyMembership[];
  const scoreByGroup = new Map(
    myRows.map((m) => [m.group_id, Number(m.trust_score_cache)]),
  );
  // On-time/late record behind each score: settled contributions on the
  // caller's own membership rows. Missing/pending rows are not trust events.
  const recordByGroup = new Map<string, { onTime: number; late: number }>();
  if (user && myRows.length > 0) {
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
    user && circleIds.length > 0
      ? await supabase
          .from("groups")
          .select("id, name")
          .in("id", circleIds)
          .order("name", { ascending: true })
      : { data: [] };
  const myCircles = (circles ?? []) as { id: string; name: string }[];

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Your profile photo"
            className="h-14 w-14 rounded-2xl object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo/10 dark:bg-white/10">
            <HugeiconsIcon
              icon={UserIcon}
              size={26}
              className="text-indigo dark:text-gold"
            />
          </span>
        )}
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {profile?.full_name || "Your profile"}
          </h1>
          <p className="font-mono text-xs text-indigo/60">
            {profile?.phone ?? user?.email ?? ""}
          </p>
        </div>
      </div>

      {user && (
        <AvatarUploader
          userId={user.id}
          currentUrl={profile?.avatar_url ?? null}
        />
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-ink dark:text-white">
        <HugeiconsIcon
          icon={ShieldCheckIcon}
          size={22}
          className={verified ? "text-indigo" : "text-indigo"}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {verified ? "Number verified" : "Number not verified"}
          </p>
          <p className="text-xs leading-5 text-indigo/60">
            {verified
              ? "USSD can identify you by this number."
              : "Verify a number to unlock anything USSD-related."}
          </p>
        </div>
        {!verified && (
          <Link
            href="/add-phone?next=/profile"
            className="shrink-0 rounded-full bg-indigo px-4 py-2 text-xs font-semibold text-paper"
          >
            Verify
          </Link>
        )}
      </div>

      {user && myCircles.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-semibold">
            Trust in each circle
          </h2>
          <ul className="flex flex-col gap-2">
            {myCircles.map((g, i) => {
              const score = scoreByGroup.get(g.id);
              const record = recordByGroup.get(g.id);
              const settledTotal =
                (record?.onTime ?? 0) + (record?.late ?? 0);
              const recordDetail =
                settledTotal === 0
                  ? "No payments yet"
                  : `${record?.onTime ?? 0} on-time · ${record?.late ?? 0} late`;
              return (
                <RevealLi
                  key={g.id}
                  delay={Math.min(i * 0.05, 0.2)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-indigo/10 bg-paper p-4"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/groups/${g.id}`}
                      className="block truncate text-sm font-semibold"
                    >
                      {g.name}
                    </Link>
                    <p className="font-mono text-xs text-indigo/50">
                      {recordDetail}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-indigo/15 px-3 py-1 text-xs font-semibold text-indigo">
                    Trust{""}
                    {score !== undefined && Number.isFinite(score)
                      ? score
                      : 100}
                  </span>
                </RevealLi>
              );
            })}
          </ul>
          <p className="text-xs leading-5 text-indigo/60">
            Scores are per-circle and move with on-time payments — the counts
            show what each score is built from.
          </p>
        </section>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <SignOutButton />
      </div>
    </main>
  );
}
