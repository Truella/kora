import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, Add01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Circles" };

const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  GHS: "GH₵",
  KES: "KSh",
  UGX: "USh",
};

export default async function GroupsPage() {
  const supabase = await createClient();
  // RLS ("view groups you belong to") returns only the caller's circles.
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, contribution_amount, currency, frequency, status")
    .order("created_at", { ascending: false });

  if (!groups || groups.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo/10 dark:bg-white/10">
          <HugeiconsIcon
            icon={UserGroupIcon}
            size={26}
            className="text-indigo dark:text-gold"
          />
        </span>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-white">
          No circles yet
        </h1>
        <p className="max-w-xs text-sm leading-6 text-zinc-500">
          Create one to get started — once you join a circle, it will show up
          here.
        </p>
        <Link
          href="/groups/new"
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink"
        >
          <HugeiconsIcon icon={Add01Icon} size={18} />
          Create a circle
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-3 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-white">
          Your circles
        </h1>
        <Link
          href="/groups/new"
          aria-label="Create a circle"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-ink"
        >
          <HugeiconsIcon icon={Add01Icon} size={20} />
        </Link>
      </div>
      <ul className="flex flex-col gap-3">
        {groups.map((group) => (
          <li
            key={group.id}
            className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-ink"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo/10 dark:bg-white/10">
              <HugeiconsIcon
                icon={UserGroupIcon}
                size={22}
                className="text-indigo dark:text-gold"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-semibold text-ink dark:text-white">
                {group.name}
              </p>
              <p className="font-mono text-xs text-zinc-500">
                {SYMBOLS[group.currency] ?? group.currency}
                {Number(group.contribution_amount).toLocaleString()} ·{" "}
                {group.frequency} · {group.status}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
