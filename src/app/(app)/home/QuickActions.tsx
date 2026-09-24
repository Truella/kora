import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

// Join-with-link moved to the dashboard header. This surface now keeps only
// the other creation path so starting another circle stays discoverable without
// pushing a paste form to the bottom of the page.
export default function QuickActions() {
  return (
    <section className="flex flex-col gap-4 rounded-[20px] border-[0.5px] border-border bg-surface p-5 shadow-[0_12px_30px_rgba(11,38,36,0.05)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
          Build your circle
        </p>
        <h2 className="mt-1.5 font-display text-lg font-semibold tracking-tight text-text-primary">
          Save with people you trust
        </h2>
      </div>

      <Link
        href="/groups/new"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-primary-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <HugeiconsIcon icon={Add01Icon} size={16} />
        Start a new circle
      </Link>
    </section>
  );
}
