import { ArrowRight, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function JoinCardTrigger({
  onOpen,
  className,
}: {
  onOpen: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onOpen}
      className={cn(
        "h-auto w-full items-start justify-start gap-3 rounded-[16px] p-4 text-left",
        className,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-black/[0.035] text-primary">
        <Link2 aria-hidden size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-text-primary">
          Join with a link
        </span>
        <span className="mt-0.5 block text-xs font-normal text-text-secondary">
          Paste an invite someone sent you
        </span>
      </span>
      <ArrowRight
        aria-hidden
        className="mt-3 shrink-0 text-text-secondary"
        size={16}
      />
    </Button>
  );
}
