import { HugeiconsIcon } from "@hugeicons/react";
import { Activity01Icon } from "@hugeicons/core-free-icons";

export const metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo/10 dark:bg-white/10">
        <HugeiconsIcon
          icon={Activity01Icon}
          size={26}
          className="text-indigo dark:text-gold"
        />
      </span>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Nothing yet</h1>
      <p className="max-w-xs text-sm leading-6 text-zinc-500">
        Contributions, payouts, and votes will stream in here once your circles
        are active. The live ledger lands on Day 4.
      </p>
    </main>
  );
}
