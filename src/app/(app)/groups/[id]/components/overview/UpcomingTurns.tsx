import { TurnRow } from "../../components/TurnViews";
import type { UpcomingTurnRow } from "@/types/circle";

export function UpcomingTurns({ rows }: { rows: UpcomingTurnRow[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg font-semibold tracking-tight text-text-primary">
        Upcoming turns
      </h2>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <TurnRow
            key={row.anchorId}
            anchorId={row.anchorId}
            turnNumber={row.turnNumber}
            meta={row.meta}
            shareLine={row.shareLine}
          />
        ))}
      </ul>
    </section>
  );
}
