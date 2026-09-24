"use client";

import ErrorShell from "./ErrorShell";

// Last-resort boundary. The root layout itself failed, so this file renders
// its own <html>/<body> and inherits no fonts, header or sidebar by
// definition — it is the one boundary that bypasses the layout tree.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-bg font-sans text-text-primary">
        <ErrorShell>
          <h1 className="mt-8 font-display text-2xl font-semibold tracking-tight text-text-primary">
            Kora couldn&apos;t start
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">
            Something failed before the app could load. Try again, and if it
            keeps happening, go back to the home page.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-[10px] bg-primary px-5 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Try again
            </button>
            {/* Plain anchor, not next/link: this boundary replaces the root
                layout, so the app-router context may be absent — Link must
                not be able to throw from inside the error boundary. */}
            {/* eslint-disable @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="rounded-[10px] text-sm font-semibold text-text-secondary hover:text-text-primary"
            >
              Back to Kora home
            </a>
            {/* eslint-enable @next/next/no-html-link-for-pages */}
          </div>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-8 max-w-md overflow-x-auto rounded-[14px] border-[0.5px] border-border bg-surface p-4 text-left font-mono text-xs text-danger">
              {error.message}
            </pre>
          )}
        </ErrorShell>
      </body>
    </html>
  );
}
