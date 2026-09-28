import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import CircleHeader from "../components/CircleHeader";

// This route group contains only the three workspace tabs. Keeping the header
// in their shared layout preserves it while the page below streams in.
export default async function CircleWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [groupRes, membershipRes, countRes, cycleRes] = await Promise.all([
    supabase
      .from("groups")
      .select("id, name, contribution_amount, currency, frequency, status")
      .eq("id", id)
      .maybeSingle(),
    user
      ? supabase
          .from("group_members")
          .select("id")
          .eq("group_id", id)
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", id)
      .eq("status", "active"),
    supabase
      .from("cycles")
      .select("id", { count: "exact", head: true })
      .eq("group_id", id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      {groupRes.data && membershipRes.data && (
        <CircleHeader
          group={groupRes.data}
          memberCount={countRes.count ?? 0}
          inviterId={user?.id ?? null}
          showInvite={groupRes.data.status !== "completed"}
          hasCycles={(cycleRes.count ?? 0) > 0}
        />
      )}
      {children}
    </main>
  );
}
