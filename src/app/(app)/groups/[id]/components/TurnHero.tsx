import type { ReactNode } from "react";
import { ANCHOR_MT, DARK_HERO } from "@/constants/circle";

// The current-turn hero: dark petrol card, contribution vs turn columns,
// share progress. States arrive as nodes; this owns layout only.
export function TurnHero({
  anchorId,
  turnNumber,
  chip,
  positionLine,
  contributionAmount,
  contributionState,
  receiverLabel,
  receiverAmount,
  receiverHighlight,
  receiverSub,
  settled,
  expected,
}: {
  anchorId: string;
  turnNumber: number;
  chip: ReactNode;
  positionLine?: string | null;
  contributionAmount: string;
  contributionState: ReactNode;
  receiverLabel: string;
  receiverAmount: string;
  receiverHighlight: boolean;
  receiverSub: ReactNode;
  settled: number;
  expected: number;
}) {
  return (
    <section
      id={anchorId}
      className={`${ANCHOR_MT} relative overflow-hidden rounded-[20px] ${DARK_HERO} p-5 text-white shadow-[0_18px_42px_rgba(11,38,36,0.16)] sm:p-6`}
    >
      <div
        aria-hidden
        className="absolute -right-16 -top-20 h-52 w-52 rounded-full border border-white/10"
      />
      <div
        aria-hidden
        className="absolute -right-7 -top-10 h-32 w-32 rounded-full border border-white/10"
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold tracking-tight text-white">
            Turn {turnNumber}
          </h2>
          {chip}
        </div>
        {positionLine ? (
          <p className="mt-1 text-xs font-semibold tabular-nums text-white/65">
            {positionLine}
          </p>
        ) : null}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-white/60">
              Your contribution
            </p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight text-white">
              {contributionAmount}
            </p>
            <div className="mt-2">{contributionState}</div>
          </div>
          <div
            className={`min-w-0 rounded-[12px] p-3.5 ${receiverHighlight ? "bg-[#E2C98F]/15" : "bg-white/10"}`}
          >
            <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-white/60">
              {receiverLabel}
            </p>
            <p
              className={`mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight ${receiverHighlight ? "text-[#E2C98F]" : "text-white"}`}
            >
              {receiverAmount}
            </p>
            <div className="mt-2 text-xs leading-5 text-white/70">
              {receiverSub}
            </div>
          </div>
        </div>
        <div className="mt-5">
          <p className="text-xs tabular-nums text-white/65">
            {expected === 1
              ? `${settled} of 1 person has paid`
              : settled === 1
                ? `1 of ${expected} people has paid`
                : `${settled} of ${expected} people have paid`}
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[#E2C98F]"
              style={{
                width: `${expected > 0 ? Math.min(100, Math.round((settled / expected) * 100)) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
