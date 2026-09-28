import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { RevealLi } from "@/components/Reveal";
import { IDENTITY_WASH, STATUS_BADGE, STATUS_LABEL } from "@/constants/circle";
import { memberLine, nextEvent } from "@/lib/circles";
import type { HomeCircle } from "@/lib/home";

export function CircleRow({
  circle,
  index,
}: {
  circle: HomeCircle;
  index: number;
}) {
  const event = nextEvent(circle);
  const members = memberLine(circle);
  return (
    <RevealLi
      delay={Math.min(index * 0.05, 0.25)}
      className="rounded-[14px] border-[0.5px] border-border bg-surface transition-colors duration-150 hover:border-primary/25"
    >
      <Link href={circle.href} className="flex gap-4 px-5 py-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${IDENTITY_WASH[circle.status] ?? IDENTITY_WASH.active}`}
        >
          <HugeiconsIcon icon={UserGroupIcon} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="truncate font-display text-lg font-semibold capitalize tracking-tight text-text-primary">
              {circle.name}
            </h2>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[circle.status] ?? STATUS_BADGE.active}`}
            >
              {STATUS_LABEL[circle.status] ?? circle.status}
            </span>
          </div>
          <p className="mt-1.5 text-sm">
            <span className="font-display font-semibold tabular-nums text-text-primary">
              {circle.amountLabel}
            </span>{" "}
            <span className="text-text-secondary">{circle.frequency}</span>
          </p>
          {members && (
            <p className="mt-0.5 text-xs text-text-secondary">{members}</p>
          )}
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <p
              className={`min-w-0 truncate text-[13px] ${event.emphasis ? "font-semibold text-text-primary" : "text-text-secondary"}`}
            >
              {event.text}
            </p>
            <span className="shrink-0 text-[13px] font-semibold text-primary">
              View <span aria-hidden="true">→</span>
            </span>
          </div>
        </div>
      </Link>
    </RevealLi>
  );
}
