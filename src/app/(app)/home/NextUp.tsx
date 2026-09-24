import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowRight01Icon,
  Clock01Icon,
  UserMultipleIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import type { HomeSnapshot } from "@/lib/home";

type NextUpContent = {
  eyebrow: string;
  value: string;
  title: string;
  meta: string;
  href: string;
  cta: string;
  icon: typeof Alert02Icon;
  tone: "danger" | "warning" | "primary" | "payout" | "neutral";
};

export default function NextUp({ snapshot }: { snapshot: HomeSnapshot }) {
  const content = nextUpContent(snapshot);
  if (!content) return null;

  const tone = TONES[content.tone];

  return (
    <aside
      className={`relative flex h-full min-h-[248px] flex-col overflow-hidden rounded-[20px] border-[0.5px] p-5 shadow-[0_12px_30px_rgba(11,38,36,0.05)] ${tone.surface}`}
    >
      <p
        className={`font-mono text-[10px] font-semibold tracking-[0.16em] ${tone.eyebrow}`}
      >
        {content.eyebrow}
      </p>

      <p className="mt-5 font-display text-[32px] font-semibold leading-tight tracking-[-0.03em] tabular-nums text-text-primary">
        {content.value}
      </p>

      <div className="mt-5 flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.icon}`}
        >
          <HugeiconsIcon icon={content.icon} size={17} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">
            {content.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-text-secondary">
            {content.meta}
          </p>
        </div>
      </div>

      <Link
        href={content.href}
        className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-primary-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {content.cta}
        <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
      </Link>
    </aside>
  );
}

function nextUpContent(snapshot: HomeSnapshot): NextUpContent | null {
  const action = snapshot.attention[0];
  if (action?.kind === "money") {
    return {
      eyebrow: action.tone === "overdue" ? "OVERDUE" : "DUE SOON",
      value: action.amountLabel,
      title: action.groupName,
      meta:
        action.tone === "overdue"
          ? `Overdue by ${action.daysLate} day${action.daysLate === 1 ? "" : "s"}`
          : `Due ${action.dueLabel}`,
      href: action.href,
      cta: "Contribute",
      icon: action.tone === "overdue" ? Alert02Icon : Clock01Icon,
      tone: action.tone === "overdue" ? "danger" : "warning",
    };
  }
  if (action?.kind === "vote") {
    return {
      eyebrow: "JOIN REQUEST",
      value: `${action.pendingCount} pending join${action.pendingCount === 1 ? "" : "s"}`,
      title: action.groupName,
      meta: "Your vote is needed",
      href: action.href,
      cta: "Review request",
      icon: UserMultipleIcon,
      tone: "primary",
    };
  }

  const nextContribution = snapshot.circles.find(
    (circle) => !circle.awaitingSchedule && circle.nextDueLabel,
  );
  if (nextContribution) {
    return {
      eyebrow: "NEXT CONTRIBUTION",
      value: nextContribution.amountLabel,
      title: nextContribution.name,
      meta: `Due ${nextContribution.nextDueLabel}`,
      href: nextContribution.href,
      cta: "View circle",
      icon: Clock01Icon,
      tone: "neutral",
    };
  }

  const nextPayout = snapshot.circles.find((circle) => circle.myPayoutLabel);
  if (nextPayout) {
    return {
      eyebrow: "YOUR NEXT PAYOUT",
      value: nextPayout.myPayoutLabel!,
      title: nextPayout.name,
      meta: nextPayout.myPayoutDateLabel ?? "Scheduled in this rotation",
      href: nextPayout.href,
      cta: "View payout",
      icon: Clock01Icon,
      tone: "payout",
    };
  }

  const scheduleCircle = snapshot.circles.find(
    (circle) => circle.awaitingSchedule,
  );
  if (scheduleCircle) {
    return {
      eyebrow: "CIRCLE UPDATE",
      value: "Schedule pending",
      title: scheduleCircle.name,
      meta: "Waiting for the organizer to start the rotation",
      href: scheduleCircle.href,
      cta: "View circle",
      icon: Clock01Icon,
      tone: "warning",
    };
  }

  const completeCircle = snapshot.circles.find(
    (circle) => circle.status === "completed",
  );
  if (completeCircle) {
    return {
      eyebrow: "CIRCLE STATUS",
      value: "Rotation complete",
      title: completeCircle.name,
      meta: `${completeCircle.cyclesSettled} of ${completeCircle.cyclesEnrolled} shares settled`,
      href: completeCircle.href,
      cta: "View history",
      icon: Wallet01Icon,
      tone: "neutral",
    };
  }

  return null;
}

const TONES = {
  danger: {
    surface: "border-[#E9C9C5] bg-[#FFF9F8]",
    icon: "bg-[#F3E1E0] text-danger",
    eyebrow: "text-danger",
  },
  warning: {
    surface: "border-[#E7D8B8] bg-[#FFFCF6]",
    icon: "bg-[#F8EDD9] text-[#8A5F14]",
    eyebrow: "text-[#8A5F14]",
  },
  primary: {
    surface: "border-[#CFE0DC] bg-[#F8FBFA]",
    icon: "bg-[#E0ECE9] text-primary",
    eyebrow: "text-primary",
  },
  payout: {
    surface: "border-border bg-surface",
    icon: "bg-[#F3EDDF] text-[#7A6028]",
    eyebrow: "text-text-secondary",
  },
  neutral: {
    surface: "border-border bg-surface",
    icon: "bg-[#E0ECE9] text-primary",
    eyebrow: "text-text-secondary",
  },
} as const;
