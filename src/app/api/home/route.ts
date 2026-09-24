import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHomeSnapshot } from "@/lib/home";

// Read-only refetch endpoint for /home. It exists so the client can refresh
// the command centre on a realtime event without re-implementing the
// derivation: both this route and the server render call getHomeSnapshot, so
// the two cannot drift.
//
// Excluded from the proxy matcher on purpose. The matcher would otherwise
// 307 an unauthenticated request to /login and hand the client an HTML page,
// where res.json() throws a parse error instead of reading a clean 401. Here
// the session check is local and the failure mode is legible.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Pre-formatted strings, never raw numbers: a client that re-formatted
    // these with its own locale would disagree with the server render.
    return NextResponse.json(await getHomeSnapshot(supabase));
  } catch (err) {
    console.error("home snapshot failed", err);
    return NextResponse.json(
      { error: "Could not load your home summary." },
      { status: 500 },
    );
  }
}
