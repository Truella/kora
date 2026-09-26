export default function GroupsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="h-8 w-36 animate-pulse rounded-[10px] bg-black/[0.05]" />
        <div className="h-11 w-11 animate-pulse rounded-[14px] bg-black/[0.05]" />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-[20px] border-[0.5px] border-border bg-surface p-5"
          >
            <div className="h-6 w-2/3 animate-pulse rounded-[8px] bg-black/[0.05]" />
            <div className="h-4 w-1/2 animate-pulse rounded-[8px] bg-black/[0.05]" />
            <div className="h-2.5 animate-pulse rounded-full bg-black/[0.05]" />
            <div className="h-4 w-1/3 animate-pulse rounded-[8px] bg-black/[0.05]" />
          </div>
        ))}
      </div>
    </main>
  );
}
