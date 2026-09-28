import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMemberRows } from "@/lib/members";
import MembersLive from "../../components/MembersLive";


export const metadata = { title: "Members" };

export default async function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: group } = await supabase
    .from("groups")
    .select(
      "id, name, contribution_amount, currency, frequency, status, created_by",
    )
    .eq("id", id)
    .maybeSingle();

  const { data: member } = user
    ? await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };

  if (!group || !member) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
          Members unavailable
        </h1>
        <p className="max-w-xs text-sm leading-6 text-text-secondary">
          It may not exist, or you are not a member of it.
        </p>
        <Link
          href="/groups"
          className="mt-2 rounded-[10px] bg-primary px-5 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Back to circles
        </Link>
      </main>
    );
  }

  // Snapshot for the first paint; MembersLive owns realtime merging from
  // here — same derivation via getMemberRows, so the two cannot drift.
  const typedGroup = group as { created_by: string };
  const initialRows = await getMemberRows(supabase, id, {
    createdBy: typedGroup.created_by,
    viewerUserId: user?.id ?? null,
  });

  return (
    <div className="flex flex-col gap-4">
      <MembersLive groupId={id} initialRows={initialRows} />
    </div>
  );
}
