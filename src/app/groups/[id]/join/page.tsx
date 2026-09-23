import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";
import JoinRequestButton from "./JoinRequestButton";

export const metadata = { title: "Join circle" };

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ by?: string }>;
}) {
  const { id } = await params;
  const { by } = await searchParams;
  // Attribution is best-effort: UUID-shaped ids ride along for the DB
  // to validate (is_valid_inviter), anything else rides as nothing.
  const invitedBy =
    by &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      by,
    )
      ? by
      : null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS filters group_members to the caller's own memberships, so a
  // non-member simply gets no row here — no error branch needed.
  const { data: member } = user
    ? await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };

  // Applicant's own request (Day 5B). Readable via the "applicants view
  // own requests" policy; pre-migration this is simply null and the page
  // falls through to the request button — same as today. Status only,
  // never vote counts: applicant-blindness stays intact.
  const { data: myRequest } =
    user && !member
      ? await supabase
          .from("join_requests")
          .select("status")
          .eq("group_id", id)
          .eq("applicant_id", user.id)
          .maybeSingle()
      : { data: null };
  const myStatus = (myRequest as { status?: string } | null)?.status ?? null;

  return (
    <main className="flex flex-1 flex-col items-center px-8 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo/10">
        <HugeiconsIcon
          icon={UserGroupIcon}
          size={26}
          className="text-indigo"
        />
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-indigo">
        You&apos;re invited
      </h1>
      <p className="mt-2 max-w-xs text-sm leading-6 text-indigo/60">
        Someone shared this circle with you. Only people with this link can
        ask to join — and the group votes every new member in.
      </p>

      <div className="mt-5 w-full max-w-xs">
        {member ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-2xl bg-indigo/10 px-4 py-3 text-sm text-indigo">
              You&apos;re already a member of this circle.
            </p>
            <Link
              href={`/groups/${id}`}
              className="rounded-full bg-indigo px-6 py-3 text-sm font-semibold text-paper hover:bg-indigo-hover"
            >
              Open the circle
            </Link>
          </div>
        ) : myStatus === "pending" ? (
          <p className="rounded-2xl bg-gold/15 px-4 py-3 text-sm leading-6 text-indigo">
            Request sent — the circle is still voting. Someone from the
            group will tell you the outcome.
          </p>
        ) : myStatus === "rejected" ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-2xl bg-gold/15 px-4 py-3 text-sm leading-6 text-indigo">
              The circle voted not to admit you this time. If that was a
              mistake, you can ask once more — it starts a fresh vote.
            </p>
            <JoinRequestButton groupId={id} invitedBy={invitedBy} />
          </div>
        ) : (
          <JoinRequestButton groupId={id} invitedBy={invitedBy} />
        )}
      </div>
    </main>
  );
}
