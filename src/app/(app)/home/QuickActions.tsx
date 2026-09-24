"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Link01Icon } from "@hugeicons/core-free-icons";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

// Circles are invite-only by design — SCOPE.md puts public/stranger pools out
// of scope, so there is no directory to browse and no discovery surface here.
// The paste field turns a link someone already sent into the join page.
function extractGroupId(raw: string): string | null {
  const match = new RegExp(
    `/groups/(${UUID})(?:/join)?`,
    "i",
  ).exec(raw.trim());
  if (match) return match[1].toLowerCase();
  const bare = new RegExp(`^(${UUID})$`, "i").exec(raw.trim());
  return bare ? bare[1].toLowerCase() : null;
}

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
    <section className="grid gap-5 rounded-[20px] border-[0.5px] border-border bg-surface p-5 shadow-[0_12px_30px_rgba(11,38,36,0.05)] md:grid-cols-[minmax(220px,0.75fr)_minmax(0,1.25fr)] md:items-center">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
          Build your circle
        </p>
        <h2 className="mt-1.5 font-display text-lg font-semibold tracking-tight text-text-primary">
          Save with people you trust
        </h2>
        <Link
          href="/groups/new"
          className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-primary-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
          Start a new circle
        </Link>
      </div>

      <form
        onSubmit={handleJoin}
        className="rounded-[14px] bg-black/[0.025] p-4"
      >
        <label
          htmlFor="invite-link"
          className="flex items-center gap-1.5 text-xs font-semibold text-text-primary"
        >
          <HugeiconsIcon icon={Link01Icon} size={14} />
          Got an invite link?
        </label>
        <div className="mt-2 flex items-center gap-3">
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
            className="min-w-0 flex-1 border-0 bg-transparent px-0 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-secondary/55 focus:ring-0"
          />
          <button
            type="submit"
            className="shrink-0 rounded-[8px] bg-primary px-3 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-primary-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Join
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </form>
    </section>
  );
}
