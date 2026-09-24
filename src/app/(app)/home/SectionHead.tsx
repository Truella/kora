import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

// Section hierarchy now comes from scale, weight and surrounding surface rather
// than a repeated full-width rule. The shared component keeps titles and escape
// links consistent without reintroducing the document-like divider stack.
export default function SectionHead({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-lg font-semibold tracking-tight text-text-primary">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          See all
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </Link>
      )}
    </div>
  );
}
