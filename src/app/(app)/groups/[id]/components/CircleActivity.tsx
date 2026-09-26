import { createClient } from "@/lib/supabase/server";
import { getLedgerEvents } from "@/lib/ledger";
import LedgerFeed from "@/components/ledger/LedgerFeed";

const ANCHOR_MT = "scroll-mt-[calc(var(--app-header-h)+1rem)]";

export default async function CircleActivity({
  groupId,
  memberId,
}: {
  groupId: string;
  memberId: string | null;
}) {
  if (!memberId) return null;
  const supabase = await createClient();
  const ledger = await getLedgerEvents(supabase, groupId);
  return (
    <section id="activity" className={`${ANCHOR_MT} flex flex-col gap-3`}>
      <LedgerFeed
        initialDue={ledger.due}
        initialHistory={ledger.history}
        groupId={groupId}
        previewCount={5}
        title="Recent activity"
      />
    </section>
  );
}
