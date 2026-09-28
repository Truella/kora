import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, Add01Icon } from "@hugeicons/core-free-icons";

export function GroupsEmpty() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-primary/10">
        <HugeiconsIcon
          icon={UserGroupIcon}
          size={26}
          className="text-primary"
        />
      </span>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
        No circles yet
      </h1>
      <p className="max-w-xs text-sm leading-6 text-text-secondary">
        Create one to get started. Once you join a circle, it will show up
        here.
      </p>
      <Link
        href="/groups/new"
        className="mt-2 inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
      >
        <HugeiconsIcon icon={Add01Icon} size={18} />
        Create a circle
      </Link>
    </main>
  );
}
