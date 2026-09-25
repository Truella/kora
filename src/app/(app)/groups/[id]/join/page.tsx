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
  // to validate (is_valid_inviter checks the id is an ACTIVE MEMBER's
  // profile id — ?by= carries profiles(id), never group_members.id).
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

  // Signed-out fallback (proxy normally redirects to /login?next= with the
  // ?by= intact — this covers an expired session / direct render). The
  // sign-in CTA carries the full join URL so attribution survives auth.
  const joinPath = `/groups/${id}/join${invitedBy ? `?by=${invitedBy}` : ""}`;
  const loginHref = `/login?next=${encodeURIComponent(joinPath)}`;

  return (
    <main className="flex flex-1 flex-col items-center px-8 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-primary/10">
        <HugeiconsIcon
          icon={UserGroupIcon}
          size={26}
          className="text-primary"
        />
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-text-primary">
        You&apos;re invited
      </h1>
      <p className="mt-2 max-w-xs text-sm leading-6 text-text-secondary">
        Someone shared this circle with you. Only people with this link can
        ask to join, and the group votes every new member in.
      </p>

      <div className="mt-5 w-full max-w-xs">
        {!user ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-[10px] bg-[#F8EDD9] px-4 py-3 text-sm leading-6 text-[#8A5F14]">
              Sign in to request to join. Your invite is saved and you&apos;ll
              land back here.
            </p>
            <Link
              href={loginHref}
              className="rounded-[10px] bg-primary px-6 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Sign in to continue
            </Link>
          </div>
        ) : member ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-[10px] bg-[#E0ECE9] px-4 py-3 text-sm text-[#1E5A4E]">
              You&apos;re already a member of this circle.
            </p>
            <Link
              href={`/groups/${id}`}
              className="rounded-[10px] bg-primary px-6 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Open the circle
            </Link>
          </div>
        ) : myStatus === "pending" ? (
          <p className="rounded-[10px] bg-[#F8EDD9] px-4 py-3 text-sm leading-6 text-[#8A5F14]">
            Request sent. The circle is still voting. Someone from the
            group will tell you the outcome.
          </p>
        ) : myStatus === "rejected" ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-[10px] bg-[#F3E1E0] px-4 py-3 text-sm leading-6 text-[#8A2A21]">
              The circle voted not to admit you this time. If that was a
              mistake, you can ask once more. It starts a fresh vote.
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
