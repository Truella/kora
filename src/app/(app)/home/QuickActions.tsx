"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Link01Icon } from "@hugeicons/core-free-icons";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

// Circles are invite-only by design — SCOPE.md puts public/stranger pools out
// of scope, so there is no directory to browse and no discovery surface here.
// The paste field just turns a link someone already sent you into the join
// page. A bare id or a bare /groups/<id>/join path is accepted too, because
// that is what survives being copied out of a chat app.
function extractGroupId(raw: string): string | null {
  const match = new RegExp(
    `/groups/(${UUID})(?:/join)?`,
    "i",
  ).exec(raw.trim());
  if (match) return match[1].toLowerCase();
  const bare = new RegExp(`^(${UUID})$`, "i").exec(raw.trim());
  return bare ? bare[1].toLowerCase() : null;
}

// A footer, not a panel. There is deliberately no "Make contribution" button
// here: every unpaid contribution inside the due window is already a row in the
// attention queue linking to the exact cycle, and a second petrol button
// saying the same thing is the duplicate-weight problem this page just shed.
// PayButton → create-charge → Flutterwave remains the only path that moves
// money, and it is reached from the queue or the circle page.
export default function QuickActions() {
  const router = useRouter();
  const [invite, setInvite] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    const groupId = extractGroupId(invite);
    if (!groupId) {
      setError("That doesn't look like an invite link. Paste the full link.");
      return;
    }
    router.push(`/groups/${groupId}/join`);
  }

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-5">
      <Link
        href="/groups/new"
        className="flex w-fit items-center gap-2 rounded-[6px] text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
      >
        <HugeiconsIcon icon={Add01Icon} size={16} />
        Start a new circle
      </Link>

      {/* The only route into a circle that exists, so it cannot be hidden — but
          an underline rather than a box keeps it at footer weight. */}
      <form onSubmit={handleJoin} className="flex flex-col gap-1.5">
        <label
          htmlFor="invite-link"
          className="flex items-center gap-1.5 text-xs text-text-secondary"
        >
          <HugeiconsIcon icon={Link01Icon} size={14} />
          Got an invite link?
        </label>
        <div className="flex items-center gap-3">
          <input
            id="invite-link"
            value={invite}
            onChange={(e) => {
              setInvite(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste it here"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 border-0 border-b border-border bg-transparent px-0 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary/60 focus:border-primary"
          />
          <button
            type="submit"
            className="shrink-0 rounded-[6px] py-1 text-sm font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Join
          </button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </section>
  );
}
