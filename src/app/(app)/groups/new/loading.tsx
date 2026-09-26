export default function NewGroupLoading() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-[10px] bg-black/[0.05]" />
        <div className="flex flex-col gap-2">
          <div className="h-7 w-44 animate-pulse rounded-[8px] bg-black/[0.05]" />
          <div className="h-4 w-64 animate-pulse rounded-[8px] bg-black/[0.05]" />
        </div>
      </div>
      <div className="flex flex-col gap-5 rounded-[14px] border-[0.5px] border-border bg-surface p-5">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="h-4 w-28 animate-pulse rounded-[8px] bg-black/[0.05]" />
            <div className="h-[52px] animate-pulse rounded-[10px] bg-black/[0.05]" />
          </div>
        ))}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="h-[52px] animate-pulse rounded-[10px] bg-black/[0.05]" />
          <div className="h-[52px] animate-pulse rounded-[10px] bg-black/[0.05]" />
        </div>
        <div className="h-[52px] animate-pulse rounded-[10px] bg-black/[0.05]" />
      </div>
    </main>
  );
}
