"use client";

import Link from "next/link";
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
  href: string;
  kind: CircleAttentionKind;
  label: string;
  className: string;
};

export default function CircleAttentionTooltip({
  href,
  kind,
  label,
  className,
}: CircleAttentionTooltipProps) {
  const icon = kind === "clock" ? Clock01Icon : Alert02Icon;

  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        render={
          <Link
            href={href}
            aria-label={label}
            className={`${className} focus-visible:outline-none`}
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
      <TooltipPanel className="rounded-[10px]">{label}</TooltipPanel>
    </Tooltip>
  );
}
