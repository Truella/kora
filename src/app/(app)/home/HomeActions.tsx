import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { buttonVariants } from "@/components/ui/button";
import JoinWithLink from "./JoinWithLink";

// Create and join are peer entry points, so they stay together. They become a
// compact two-column row on phones, then switch to full labels before sharing
// the greeting row on wide screens.
export default function HomeActions() {
  return (
    <div className="ml-auto grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto">
      <Link
        href="/groups/new"
        className={buttonVariants({
          size: "lg",
          className:
            "h-11 w-full min-w-0 gap-2 rounded-[14px] px-3 sm:w-auto sm:px-4",
        })}
      >
        <HugeiconsIcon icon={Add01Icon} size={17} />
        <span className="sm:hidden">Start</span>
        <span className="hidden sm:inline">Start a new circle</span>
      </Link>
      <JoinWithLink
        variant="compact"
        className="h-11 w-full min-w-0 px-3 sm:w-auto sm:px-4"
      />
    </div>
  );
}
