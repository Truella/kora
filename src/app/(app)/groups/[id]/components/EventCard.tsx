import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Tick01Icon } from "@hugeicons/core-free-icons";

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
