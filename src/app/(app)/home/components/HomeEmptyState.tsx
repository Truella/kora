import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import type { HomeSnapshot } from "@/lib/home";
import EmptyHome from "./EmptyHome";
import InviteList from "./InviteList";
import JoinWithLink from "./JoinWithLink";

const GREETING = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
} as const;

// No circles has two genuinely different states. A directed invite is real
// pending work, so it replaces the generic onboarding pitch and appears first.
// With no invite, EmptyHome still explains the product and Join remains the one
// action that Create does not already cover.
export default function HomeEmptyState({
  snapshot,
}: {
  snapshot: HomeSnapshot;
}) {
  if (snapshot.invites.length > 0) {
    return (
      <main className="flex w-full flex-1 flex-col px-4 pt-6 sm:px-6 lg:px-0 lg:pb-10 lg:pt-8">
        <header>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary lg:text-3xl">
            {GREETING[snapshot.greeting]}
            {snapshot.firstName ? `, ${snapshot.firstName}` : ""}
          </h1>
        </header>

        <section className="mt-6 flex flex-col gap-3 rounded-[20px] border-[0.5px] border-border bg-surface p-4 shadow-[0_12px_30px_rgba(11,38,36,0.05)] sm:p-5">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-text-primary">
              Circle invites
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              You have been invited to join these savings circles
            </p>
          </div>
          <ul className="grid gap-2">
            <InviteList invites={snapshot.invites} />
          </ul>
        </section>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href="/groups/new"
            className="flex w-full items-center gap-3 rounded-[16px] border-[0.5px] border-border bg-surface px-4 py-3.5 text-left shadow-[0_8px_22px_rgba(11,38,36,0.04)] transition-[transform,border-color] duration-150 ease-out hover:border-primary/20 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
              <HugeiconsIcon icon={Add01Icon} size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-text-primary">
                Start a new circle
              </span>
              <span className="mt-0.5 block text-xs text-text-secondary">
                Bring your own people together
              </span>
            </span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              className="shrink-0 text-text-secondary"
            />
          </Link>
          <JoinWithLink />
        </div>
      </main>
    );
  }

  return (
    <main className="flex w-full flex-1 flex-col px-4 pt-6 sm:px-6 lg:px-0 lg:pb-10 lg:pt-8">
      <EmptyHome snapshot={snapshot} />
      <div className="mt-6">
        <JoinWithLink />
      </div>
    </main>
  );
}
