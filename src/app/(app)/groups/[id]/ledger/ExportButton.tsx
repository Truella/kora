"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Download04Icon } from "@hugeicons/core-free-icons";

// Prints (or saves as PDF) the ledger grid. Lives beside Invite in the
// circle header on the ledger tab — an action, not a section. Teal fill;
// the label collapses to icon-only below sm like Invite does.
export default function ExportButton({ disabled }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      disabled={disabled}
      aria-label="Download ledger as PDF"
      title="Download PDF"
      className="flex shrink-0 items-center gap-1.5 rounded-[10px] bg-primary px-2.5 py-2 text-[13px] font-medium whitespace-nowrap text-white shadow-[0_2px_8px_rgba(11,38,36,0.12)] transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:opacity-50 sm:px-3.5 sm:py-2.5"
    >
      <HugeiconsIcon icon={Download04Icon} size={16} />
      <span className="hidden sm:inline">Download PDF</span>
    </button>
  );
}
