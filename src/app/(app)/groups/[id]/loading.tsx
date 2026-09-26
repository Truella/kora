export default function CircleLoading() {
  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-[10px] bg-black/[0.05]" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-6 w-1/2 animate-pulse rounded-[8px] bg-black/[0.05]" />
            <div className="h-4 w-1/3 animate-pulse rounded-[8px] bg-black/[0.05]" />
          </div>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-[10px] bg-black/[0.05]"
            />
          ))}
        </div>
      </div>
      <div className="h-64 animate-pulse rounded-[20px] bg-black/[0.05]" />
      <div className="flex flex-col gap-2">
        <div className="h-6 w-40 animate-pulse rounded-[8px] bg-black/[0.05]" />
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-[14px] bg-black/[0.05]"
          />
        ))}
      </div>
    </main>
  );
}
