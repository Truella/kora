import type { Metadata } from "next";
import Link from "next/link";
import ErrorShell from "./ErrorShell";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <ErrorShell>
      <h1 className="mt-8 font-display text-2xl font-semibold tracking-tight text-text-primary">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">
        The link may be out of date, or the circle may have been removed.
        Your circles are still where you left them.
      </p>
      <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <Link
          href="/home"
          className="inline-flex items-center justify-center rounded-[10px] bg-primary px-5 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Go to your circles
        </Link>
        <Link
          href="/"
          className="rounded-[10px] text-sm font-semibold text-text-secondary hover:text-text-primary"
        >
          Back to Kora home
        </Link>
      </div>
    </ErrorShell>
  );
}
