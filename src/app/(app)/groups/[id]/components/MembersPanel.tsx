import Image from "next/image";
import type { MemberRow } from "@/types/circle";

// One tint per share state, worn by both the avatar wash and the pill so
// the two can never disagree.
const SHARE_TONE = {
  paid: {
    label: "Paid",
    tone: "bg-[#E0ECE9] text-[#1E5A4E]",
  },
  pending: {
    label: "To pay",
    tone: "bg-[#F8EDD9] text-[#8A5F14]",
  },
  late: {
    label: "Paid late",
    tone: "bg-[#F3E1E0] text-[#8A2A21]",
  },
} as const;

// Rotation list: who is in the circle, how they joined, when they
// collect, their trust score, and what their share looks like this turn.
// One quiet facts line under the name; the share pill docked right is
// the only loud thing per row.
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
        <div className="flex items-center gap-2">
          <h2 className="font-display text-base font-semibold tracking-tight text-text-primary">
            Members
          </h2>
          <span className="rounded-full bg-black/[0.05] px-2 py-px font-mono text-[11px] font-semibold tabular-nums text-text-secondary">
            {count}
          </span>
        </div>
        {note ? (
          <p className="mt-0.5 text-[11px] text-text-secondary">{note}</p>
        ) : null}
      </div>
      <ul className="flex flex-col divide-y divide-border px-2 pb-2">
        {rows.map((m) => {
          const tone = m.share ? SHARE_TONE[m.share] : null;
          return (
            <li
              key={m.id}
              className="flex items-center gap-3 px-2 py-2.5"
            >
              {m.avatarUrl ? (
                <Image
                  src={m.avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${tone ? tone.tone : "bg-black/[0.04] text-text-secondary"}`}
                >
                  {m.initial}
                </span>
              )}
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
                <p className="mt-0.5 font-mono text-[11px] leading-4 text-text-secondary">
                  {m.role} · Collects turn {m.slot} ·{" "}
                  {m.trust != null ? `Trust ${m.trust}` : "No score yet"}
                </p>
              </div>
              {tone ? (
                <span
                  aria-label={`This turn's share: ${tone.label}`}
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone.tone}`}
                >
                  {tone.label}
                </span>
              ) : (
                ""
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
