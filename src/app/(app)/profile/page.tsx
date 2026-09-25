import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, ShieldCheckIcon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";
import { RevealLi } from "../../Reveal";
import ProfileEditor from "./ProfileEditor";
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
    <main className="flex flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt="Your profile photo"
            width={56}
            height={56}
            className="h-14 w-14 rounded-[14px] object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-primary/10">
            <HugeiconsIcon
              icon={UserIcon}
              size={26}
              className="text-primary"
            />
          </span>
        )}
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            {profile?.full_name || "Your profile"}
          </h1>
          {profile?.phone && (
            <p className="font-mono text-xs text-text-secondary">
              {profile.phone}
            </p>
          )}
          {user?.email && (
            <p className="font-mono text-xs text-text-secondary">
              {user.email}
            </p>
          )}
        </div>
      </div>

      {user && (
        <ProfileEditor
          userId={user.id}
          currentName={profile?.full_name ?? ""}
          currentAvatarUrl={profile?.avatar_url ?? null}
          currentEmail={user.email ?? null}
        />
      )}

      <div className="flex items-center gap-3 rounded-[14px] border-[0.5px] border-border bg-surface p-4">
        <HugeiconsIcon
          icon={ShieldCheckIcon}
          size={22}
          className={verified ? "text-success" : "text-text-secondary"}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">
            {verified ? "Number verified" : "Number not verified"}
          </p>
          <p className="text-xs leading-5 text-text-secondary">
            {verified
              ? "USSD can identify you by this number."
              : "Verify a number to unlock anything USSD-related."}
          </p>
        </div>
        {!verified && (
          <Link
            href="/add-phone?next=/profile"
            className="shrink-0 rounded-[10px] bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
          >
            Verify
          </Link>
        )}
      </div>

      {user && myCircles.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-semibold text-text-primary">
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
                  className="flex items-center justify-between gap-3 rounded-[10px] border-[0.5px] border-border bg-surface p-4"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/groups/${g.id}`}
                      className="block truncate text-sm font-semibold text-text-primary"
                    >
                      {g.name}
                    </Link>
                    <p className="font-mono text-xs text-text-secondary">
                      {recordDetail}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#F3EDDF] px-3 py-1 text-xs font-semibold text-[#7A6028]">
                    Trust{""}
                    {score !== undefined && Number.isFinite(score)
                      ? score
                      : 100}
                  </span>
                </RevealLi>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <SignOutButton />
      </div>
    </main>
  );
}
