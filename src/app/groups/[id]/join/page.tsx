import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";
import JoinRequestButton from "./JoinRequestButton";

export const metadata = { title: "Join circle" };

export default async function JoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  return (
    <main className="flex flex-1 flex-col items-center px-8 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo/10 dark:bg-white/10">
        <HugeiconsIcon
          icon={UserGroupIcon}
          size={26}
          className="text-indigo dark:text-gold"
        />
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink dark:text-white">
        You&apos;re invited
      </h1>
      <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
        Someone shared this circle with you. Only people with this link can
        ask to join — and the group votes every new member in.
      </p>

      <div className="mt-5 w-full max-w-xs">
        {member ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-2xl bg-jade/10 px-4 py-3 text-sm text-ink dark:text-white">
              You&apos;re already a member of this circle.
            </p>
            <Link
              href={`/groups/${id}`}
              className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink"
            >
              Open the circle
            </Link>
          </div>
        ) : (
          <JoinRequestButton groupId={id} />
        )}
      </div>
    </main>
  );
}
