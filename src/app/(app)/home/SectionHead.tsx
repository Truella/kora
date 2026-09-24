import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

// One header for every section on the page. The hairline it carries is what
// replaced the stack of card borders — so the rule lives here rather than being
// retyped per section, which is how "circles" and "activity" would slowly drift
// apart. A quiet title, an optional way out, and a line above.
export default function SectionHead({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-border pt-4">
      <h2 className="font-display text-base font-semibold text-text-primary">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-text-secondary transition-colors hover:text-primary"
        >
          See all
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </Link>
      )}
    </div>
  );
}
