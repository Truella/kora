import Link from "next/link";

export function CircleNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
        Circle not found
      </h1>
      <p className="max-w-xs text-sm leading-6 text-text-secondary">
        It may not exist, or you are not a member of it.
      </p>
      <Link
        href="/groups"
        className="mt-2 rounded-[10px] bg-primary px-5 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
      >
        Back to circles
      </Link>
    </main>
  );
}
