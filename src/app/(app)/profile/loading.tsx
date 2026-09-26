export default function ProfileLoading() {
  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-black/[0.05]" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-6 w-40 animate-pulse rounded-[8px] bg-black/[0.05]" />
          <div className="h-4 w-56 animate-pulse rounded-[8px] bg-black/[0.05]" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-[14px] border-[0.5px] border-border bg-surface p-4"
          >
            <div className="h-4 w-1/2 animate-pulse rounded-[8px] bg-black/[0.05]" />
            <div className="h-4 w-16 animate-pulse rounded-[8px] bg-black/[0.05]" />
          </div>
        ))}
      </div>
      <div className="h-12 animate-pulse rounded-[10px] bg-black/[0.05]" />
    </main>
  );
}
