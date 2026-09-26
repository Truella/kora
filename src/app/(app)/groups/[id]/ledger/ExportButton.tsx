"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Download04Icon } from "@hugeicons/core-free-icons";

// Prints (or saves as PDF) the ledger grid. Lives beside Invite in the
// circle header on the ledger tab — an action, not a section.
export default function ExportButton({ disabled }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      disabled={disabled}
      aria-label="Download or print ledger"
      title="Download or print"
      className="flex shrink-0 items-center rounded-[10px] bg-surface px-3 py-2 text-text-secondary shadow-[0_2px_8px_rgba(11,38,36,0.04)] transition-colors hover:bg-black/[0.04] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 sm:px-3.5 sm:py-2.5"
    >
      <HugeiconsIcon icon={Download04Icon} size={16} />
    </button>
  );
}
