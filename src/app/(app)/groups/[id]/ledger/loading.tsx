export default function LedgerLoading() {
  return (
    <main className="mx-auto flex w-full flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-52 animate-pulse rounded-[8px] bg-black/[0.05]" />
        <div className="h-4 w-72 animate-pulse rounded-[8px] bg-black/[0.05]" />
      </div>
      <div className="flex min-h-[480px] flex-col gap-3 rounded-[20px] border-[0.5px] border-border bg-surface p-5">
        <div className="h-6 w-40 animate-pulse rounded-[8px] bg-black/[0.05]" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-border py-2.5 last:border-0"
          >
            <div className="h-4 w-24 animate-pulse rounded-[8px] bg-black/[0.05]" />
            <div className="h-4 flex-1 animate-pulse rounded-[8px] bg-black/[0.05]" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-black/[0.05]" />
          </div>
        ))}
      </div>
    </main>
  );
}
