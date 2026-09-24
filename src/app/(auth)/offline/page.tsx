import Link from "next/link";

export default function Offline() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-hero-bg px-8 text-center text-white">
      <p className="font-display text-5xl font-bold">K</p>
      <h1 className="font-display text-3xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-sm text-sm leading-6 text-white/80">
        Kora needs a connection to sync your circle&apos;s ledger. Check your
        connection and try again.
      </p>
      <Link
        href="/home"
        className="rounded-[10px] bg-primary px-6 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
      >
        Retry
      </Link>
    </main>
  );
}
