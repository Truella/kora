"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import {
  Tooltip,
  TooltipPanel,
  TooltipTrigger,
} from "@/components/animate-ui/components/base/tooltip";

type CircleAttentionKind = "alert" | "clock";

type CircleAttentionTooltipProps = {
  kind: CircleAttentionKind;
  label: string;
  className: string;
};

export default function CircleAttentionTooltip({
  kind,
  label,
  className,
}: CircleAttentionTooltipProps) {
  const icon = kind === "clock" ? Clock01Icon : Alert02Icon;

  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        render={
          <span
            aria-label={label}
            className={className}
            role="img"
            tabIndex={0}
          />
        }
      >
        <HugeiconsIcon
          aria-hidden
          icon={icon}
          size={16}
          strokeWidth={2}
        />
      </TooltipTrigger>
      <TooltipPanel className="rounded-[10px] text-white">{label}</TooltipPanel>
    </Tooltip>
  );
}
