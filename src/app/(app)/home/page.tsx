import { createClient } from "@/lib/supabase/server";
import { getHomeSnapshot } from "@/lib/home";
import HomeLive from "./components/HomeLive";

export const metadata = {
  title: "Home | Kora",
};

// Reads cookies, so this route is dynamic. It was previously a static
// prerender because the placeholder page fetched nothing at all.
export default async function HomePage() {
  const supabase = await createClient();

  let snapshot;
  try {
    snapshot = await getHomeSnapshot(supabase);
  } catch (err) {
    // A data failure should not replace the app chrome with the root error
    // shell. Report it inline and let the next navigation retry.
    console.error("home snapshot failed", err);
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
          Could not load your summary
        </h1>
        <p className="max-w-xs text-sm leading-6 text-text-secondary">
          Something went wrong reading your circles. Refresh to try again.
        </p>
      </main>
    );
  }

  return <HomeLive initial={snapshot} />;
}
