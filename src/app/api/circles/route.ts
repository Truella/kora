import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHomeSnapshot } from "@/lib/home";

// Read-only refetch endpoint for the circles directory. Same contract as
// /api/home — both this route and the server render call getHomeSnapshot,
// so the two cannot drift — but with the directory's uncapped circle list
// rather than home's preview. Same proxy exclusion for the same reason:
// its own session check, legible 401 JSON.
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
    return NextResponse.json(
      await getHomeSnapshot(supabase, {
        circleLimit: Number.POSITIVE_INFINITY,
      }),
    );
  } catch (err) {
    console.error("circles snapshot failed", err);
    return NextResponse.json(
      { error: "Could not load your circles." },
      { status: 500 },
    );
  }
}
