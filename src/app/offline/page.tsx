import Link from "next/link";

export default function Offline() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-indigo px-8 text-center text-white">
      <p className="font-display text-5xl">K</p>
      <h1 className="font-display text-3xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-sm text-white/70">
        Kora needs a connection to sync your circle&apos;s ledger. Check your
        connection and try again.
      </p>
      <Link
        href="/"
        className="rounded-full bg-gold px-6 py-3 font-medium text-ink"
      >
        Retry
      </Link>
    </main>
  );
}
