export default function ActivityLoading() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="h-8 w-32 animate-pulse rounded-[10px] bg-black/[0.05]" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[14px] border-[0.5px] border-border bg-surface p-4"
          >
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-[10px] bg-black/[0.05]" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-3/4 animate-pulse rounded-[8px] bg-black/[0.05]" />
              <div className="h-3 w-1/2 animate-pulse rounded-[8px] bg-black/[0.05]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
