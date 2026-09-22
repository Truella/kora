import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, Add01Icon } from "@hugeicons/core-free-icons";

export const metadata = { title: "Circles" };

export default function GroupsPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo/10 dark:bg-white/10">
        <HugeiconsIcon
          icon={UserGroupIcon}
          size={26}
          className="text-indigo dark:text-gold"
        />
      </span>
      <h1 className="font-display text-2xl font-semibold tracking-tight">No circles yet</h1>
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
