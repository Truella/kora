import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { RevealLi } from "../../../Reveal";

// Presentational building blocks for the circle workspace. No data fetching
// here: the detail page wires Supabase rows into these props, and
// /demo/circle wires mock rows into the same components — so the state
// catalog can never drift from the real thing. Action slots (Pay, Confirm)
// take nodes: the detail page passes the live client buttons, the demo
// passes inert lookalikes.

// Anchors the /home attention queue deep-links to. Duplicated from the
// detail page so this module stays importable from the demo.
const ANCHOR_MT = "scroll-mt-[calc(var(--app-header-h)+1rem)]";

const DARK_HERO =
  "bg-[radial-gradient(circle_at_88%_8%,rgba(191,154,78,0.26),transparent_34%),linear-gradient(135deg,#0B2624_0%,#14524F_125%)]";

export function DueChip({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[#F8EDD9] px-2.5 py-0.5 text-[11px] font-semibold text-[#8A5F14]">
      {label}
    </span>
  );
}

export function SettledChip({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[#E0ECE9] px-2.5 py-0.5 text-[11px] font-semibold text-[#1E5A4E]">
      {label}
    </span>
  );
}

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

// Action cards: the hero states what is, these say what needs you. Pay and
// confirm live here — never as rows inside the turn card. Horizontal: icon
// plus text on the left, the action docked right on desktop and full-width
// on mobile.
export function EventCard({
  tone,
  eyebrow,
  title,
  sub,
  action,
}: {
  tone: "gold" | "teal";
  eyebrow: string;
  title: ReactNode;
  sub: ReactNode;
  action: ReactNode;
}) {
  const gold = tone === "gold";
  return (
    <section
      className={`flex flex-col gap-4 rounded-[20px] border-[0.5px] border-border p-5 sm:flex-row sm:items-center ${gold ? "bg-[#FAF1DE]" : "bg-[#E2EEEB]"}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${gold ? "bg-[#EFDDB4] text-[#8A5F14]" : "bg-[#C4E0D8] text-[#1E5A4E]"}`}
        >
          <HugeiconsIcon icon={gold ? Alert02Icon : Tick01Icon} size={18} />
        </span>
        <div className="min-w-0">
          <p
            className={`font-mono text-[11px] font-medium uppercase tracking-widest ${gold ? "text-[#8A5F14]" : "text-[#1E5A4E]"}`}
          >
            {eyebrow}
          </p>
          <p className="mt-1 font-display text-lg font-semibold tracking-tight text-text-primary">
            {title}
          </p>
          <div className="mt-0.5 text-xs leading-5 text-text-secondary">
            {sub}
          </div>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </section>
  );
}

export type MemberRow = {
  id: string;
  initial: string;
  wash: string;
  name: string;
  you?: boolean;
  next?: boolean;
  role: string;
  turnPos: string;
  // Null pre-schedule, when per-turn states don't exist yet.
  state?: string | null;
  trust: string;
};

// Compact single-column rotation list. Lives at the bottom of the workspace.
export function MembersPanel({
  count,
  note,
  rows,
}: {
  count: number;
  note?: string;
  rows: MemberRow[];
}) {
  return (
    <section className="overflow-hidden rounded-[20px] border-[0.5px] border-border bg-surface">
      <div className="px-4 pb-1 pt-4">
        <h2 className="font-display text-base font-semibold tracking-tight text-text-primary">
          Members · {count}
        </h2>
        {note ? (
          <p className="mt-0.5 text-[11px] text-text-secondary">{note}</p>
        ) : null}
      </div>
      <ul className="flex flex-col px-2 pb-2">
        {rows.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-3 rounded-[12px] px-2 py-2"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${m.wash}`}
            >
              {m.initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">
                {m.name}
                {m.you ? (
                  <span className="font-normal text-text-secondary">
                    {" "}
                    · You
                  </span>
                ) : (
                  ""
                )}
                {m.next ? (
                  <span className="ml-1.5 rounded-full bg-[#F8EDD9] px-2 py-px text-[10px] font-semibold text-[#8A5F14]">
                    Next
                  </span>
                ) : (
                  ""
                )}
              </p>
              <p className="truncate font-mono text-[11px] text-text-secondary">
                {m.role}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-[11px] tabular-nums text-text-secondary">
                {m.turnPos}
              </p>
              {m.state ? (
                <p className="font-mono text-[11px] text-text-secondary">
                  {m.state}
                </p>
              ) : (
                ""
              )}
              <p className="font-mono text-[11px] tabular-nums text-text-secondary">
                {m.trust}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Compressed turn rows for history + upcoming. Keeps the `cycle-<id>`
// anchor so /home attention deep-links land.
export function TurnRow({
  anchorId,
  turnNumber,
  meta,
  done,
  shareLine,
  action,
  delay = 0.05,
}: {
  anchorId: string;
  turnNumber: number;
  meta: ReactNode;
  done: boolean;
  shareLine: ReactNode;
  action?: ReactNode;
  delay?: number;
}) {
  return (
    <RevealLi
      id={anchorId}
      delay={delay}
      className={`${ANCHOR_MT} flex flex-col gap-2 rounded-[14px] border-[0.5px] border-border bg-surface p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-text-primary">
            Turn {turnNumber}
          </p>
          <p className="mt-0.5 text-xs tabular-nums leading-5 text-text-secondary">
            {meta}
          </p>
        </div>
        {done ? (
          <SettledChip label="✓ Complete" />
        ) : (
          <span className="inline-flex shrink-0 items-center rounded-full bg-[#F8EDD9] px-2.5 py-0.5 text-[11px] font-semibold text-[#8A5F14]">
            Upcoming
          </span>
        )}
      </div>
      <div className="border-t border-border pt-2.5 text-xs leading-5 text-text-secondary">
        <p>{shareLine}</p>
      </div>
      {action}
    </RevealLi>
  );
}
