"use client";

import Link from "next/link";
import { useEffect } from "react";
import ErrorShell from "./ErrorShell";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Dev overlay + console only. The message is rendered on-page in
    // development and never in production, where the digest is the handle.
    console.error(error);
  }, [error]);

  return (
    <ErrorShell>
      <h1 className="mt-8 font-display text-2xl font-semibold tracking-tight text-text-primary">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">
        That page didn&apos;t load. Trying again usually clears it.
      </p>
      <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-[10px] bg-primary px-5 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-[10px] text-sm font-semibold text-text-secondary hover:text-text-primary"
        >
          Back to Kora home
        </Link>
      </div>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-8 max-w-md overflow-x-auto rounded-[14px] border-[0.5px] border-border bg-surface p-4 text-left font-mono text-xs text-danger">
          {error.message}
        </pre>
      )}
    </ErrorShell>
  );
}
