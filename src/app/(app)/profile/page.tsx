import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, ArrowRight01Icon, ShieldCheckIcon, Mail01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";
import Reveal, { RevealLi } from "../../Reveal";
import ProfileHero from "./ProfileHero";
import SignOutButton from "./signout-button";

export const metadata = { title: "Profile" };

// Initials for the avatar fallback — first letters of the first two words.
function initials(name: string | null | undefined): string | null {
  if (!name) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[1]?.[0] ?? "") : "";
  const out = `${first}${second}`.toUpperCase();
  return out || null;
}

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
  const displayName = profile?.full_name || "Your profile";
  const fallbackInitials = initials(profile?.full_name);
  let totalOnTime = 0;
  let totalLate = 0;
  for (const r of recordByGroup.values()) {
    totalOnTime += r.onTime;
    totalLate += r.late;
  }

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      {/* Identity hero — photo and name up top, payment record as a stat
          strip so the card earns its width. Edit sits in the header, so
          the card ends cleanly on the stats (or the form while editing). */}
      <Reveal>
        {user ? (
          <ProfileHero
            displayName={displayName}
            phone={profile?.phone ?? null}
            verified={verified}
            email={user.email ?? null}
            avatarUrl={profile?.avatar_url ?? null}
            fallbackInitials={fallbackInitials}
            userId={user.id}
            currentName={profile?.full_name ?? ""}
            currentAvatarUrl={profile?.avatar_url ?? null}
            currentEmail={user.email ?? null}
            circleCount={myCircles.length}
            totalOnTime={totalOnTime}
            totalLate={totalLate}
          />
        ) : (
          <section className="rounded-[20px] border-[0.5px] border-border bg-surface p-5 sm:p-6">
            <h1 className="font-display text-xl font-semibold tracking-tight text-text-primary">
              {displayName}
            </h1>
          </section>
        )}
      </Reveal>

      {/* Account — verification and sign-in paths, grouped as rows in one
          card instead of scattered banners. */}
      <Reveal delay={0.05}>
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-semibold tracking-tight text-text-primary">
            Account
          </h2>
          <div className="divide-y divide-border overflow-hidden rounded-[14px] border-[0.5px] border-border bg-surface">
            <div className="flex items-center gap-3 p-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
                  verified
                    ? "bg-[#E0ECE9] text-primary"
                    : "bg-black/[0.04] text-text-secondary"
                }`}
              >
                <HugeiconsIcon icon={ShieldCheckIcon} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  {verified ? "Number verified" : "Number not verified"}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-text-secondary">
                  {verified
                    ? "USSD can identify you by this number."
                    : "Verify a number to unlock anything USSD-related."}
                </p>
              </div>
              {verified ? (
                <span className="shrink-0 rounded-full bg-[#E0ECE9] px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  Active
                </span>
              ) : (
                <Link
                  href="/add-phone?next=/profile"
                  className="shrink-0 rounded-[10px] bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
                >
                  Verify
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-black/[0.04] text-text-secondary">
                <HugeiconsIcon icon={Mail01Icon} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  Email sign-in
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-text-secondary">
                  {user?.email ?? "None linked — add one via Edit profile."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg font-semibold tracking-tight text-text-primary">
              Trust in each circle
            </h2>
            {myCircles.length > 0 && (
              <p className="shrink-0 font-mono text-[11px] text-text-secondary">
                {myCircles.length} circle{myCircles.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <p className="-mt-1 text-xs leading-5 text-text-secondary">
            Every circle keeps its own score.
          </p>
          {myCircles.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-[14px] border-[0.5px] border-border bg-surface px-6 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-primary/10">
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  size={24}
                  className="text-primary"
                />
              </span>
              <p className="font-display text-base font-semibold text-text-primary">
                No circles yet
              </p>
              <p className="max-w-xs text-xs leading-5 text-text-secondary">
                Join a circle and your trust record for it will show up here.
              </p>
              <Link
                href="/groups"
                className="mt-1 inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Find your circles
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Link>
            </div>
          ) : (
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
                const trust =
                  score !== undefined && Number.isFinite(score) ? score : 100;
                return (
                  <RevealLi
                    key={g.id}
                    delay={Math.min(i * 0.05, 0.2)}
                    className="rounded-[10px] border-[0.5px] border-border bg-surface transition-colors duration-150 hover:border-primary/25"
                  >
                    <Link
                      href={`/groups/${g.id}`}
                      className="flex items-center gap-3 p-4"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/10">
                        <HugeiconsIcon
                          icon={UserGroupIcon}
                          size={20}
                          className="text-primary"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-text-primary">
                          {g.name}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-text-secondary">
                          {recordDetail}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-[#F3EDDF] px-3 py-1 text-xs font-semibold whitespace-nowrap text-[#7A6028]">
                        Trust {trust}
                      </span>
                    </Link>
                  </RevealLi>
                );
              })}
            </ul>
          )}
        </section>
      </Reveal>

      <div className="pb-2">
        <SignOutButton />
      </div>
    </main>
  );
}
