"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";

// Invite is link-with-id: only people handed this link can find the
// join page. No directory, no invite-code column, no RLS change.
export default function InviteButton({ groupId }: { groupId: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/groups/${groupId}/join`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the link is in the address bar anyway.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-ink hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
    >
      {copied && <HugeiconsIcon icon={Tick01Icon} size={16} />}
      {copied ? "Link copied" : "Copy invite link"}
    </button>
  );
}
