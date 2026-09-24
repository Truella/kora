import { createClient } from "@/lib/supabase/server";
import { getLedgerEvents } from "@/lib/ledger";
import LedgerFeed from "./LedgerFeed";

export const metadata = { title: "Activity" };

export default async function ActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS scopes the snapshot to circles the caller belongs to — a
  // signed-out visitor simply gets empty lists and the empty state.
  const { due, history } = user
    ? await getLedgerEvents(supabase)
    : { due: [], history: [] };

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
        Activity
      </h1>
      <LedgerFeed initialDue={due} initialHistory={history} />
    </main>
  );
}
