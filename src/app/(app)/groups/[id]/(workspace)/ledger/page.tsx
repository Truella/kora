import { createClient } from "@/lib/supabase/server";
import { loadLedgerGrid } from "@/lib/ledger-grid";
import LedgerBook from "../../ledger/LedgerBook";
import { LedgerUnavailable } from "./LedgerUnavailable";

export const metadata = { title: "Ledger book" };

export default async function LedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const grid = await loadLedgerGrid(supabase, id, user?.id ?? null);
  if (!grid) return <LedgerUnavailable />;

  return (
    <div className="flex flex-col gap-4">
      <LedgerBook
        groupId={grid.groupId}
        summary={grid.summary}
        members={grid.members}
        periods={grid.periods}
        memberTotals={grid.memberTotals}
        expectedPerMemberLabel={grid.expectedPerMemberLabel}
        empty={grid.empty}
      />
    </div>
  );
}
