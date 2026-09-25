import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import JoinWithLink from "./JoinWithLink";

// Create and join are peer entry points, so they stay together and are built
// from the same button metrics as the Join trigger (h-11, gap-2.5, rounded
// 14px, px-3/sm:px-4). Both wrap buttonVariants in cn(): cva only
// concatenates, so `size`'s `px-6` would out-rank `px-3` in the cascade and
// render Create visibly fatter than Join. Two-column row on phones, full
// labels from sm, sharing the greeting from lg.
export default function HomeActions() {
  return (
    <div className="ml-auto grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto">
      <Link
        href="/groups/new"
        className={cn(
          buttonVariants({
            className:
              "mb-0.5 h-11 w-full min-w-0 gap-2.5 rounded-[14px] px-3 font-semibold sm:w-auto sm:px-4",
          }),
        )}
      >
        <HugeiconsIcon icon={Add01Icon} size={16} />
        <span className="sm:hidden">Start</span>
        <span className="hidden sm:inline md:text-[13px] md:tracking-[-0.01em]">
          Start a new circle
        </span>
      </Link>
      <JoinWithLink
        variant="compact"
        className="h-11 w-full min-w-0 px-3 sm:w-auto sm:px-4"
      />
    </div>
  );
}
