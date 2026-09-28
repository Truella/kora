import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMemberRows } from "@/lib/members";

// Read-only refetch endpoint for the members tab. It exists so the client
// can refresh the roster on a realtime event without re-implementing the
// derivation: both this route and the server render call getMemberRows, so
// the two cannot drift.
//
// Same legibility rule as /api/home: excluded from the proxy matcher on
// purpose so an unauthenticated request reads a clean 401, not a login page.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groupId = new URL(request.url).searchParams.get("groupId");
  if (!groupId) {
    return NextResponse.json({ error: "Missing groupId." }, { status: 400 });
  }

  const [{ data: group }, { data: member }] = await Promise.all([
    supabase
      .from("groups")
      .select("id, created_by")
      .eq("id", groupId)
      .maybeSingle(),
    supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (!group || !member) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    return NextResponse.json({
      rows: await getMemberRows(supabase, groupId, {
        createdBy: (group as { created_by: string }).created_by,
        viewerUserId: user.id,
      }),
    });
  } catch (err) {
    console.error("members snapshot failed", err);
    return NextResponse.json(
      { error: "Could not load members." },
      { status: 500 },
    );
  }
}
