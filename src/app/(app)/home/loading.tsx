export default function HomeLoading() {
  return (
    <main className="flex w-full flex-1 flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-0 lg:pb-10 lg:pt-8 xl:gap-10">
      <div className="flex items-center justify-between gap-3">
        <div className="h-8 w-48 animate-pulse rounded-[10px] bg-black/[0.05]" />
        <div className="flex gap-2">
          <div className="h-11 w-24 animate-pulse rounded-[14px] bg-black/[0.05]" />
          <div className="h-11 w-24 animate-pulse rounded-[14px] bg-black/[0.05]" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        <div className="h-44 animate-pulse rounded-[20px] bg-black/[0.05] sm:col-span-3" />
        <div className="h-44 animate-pulse rounded-[20px] bg-black/[0.05] sm:col-span-2" />
      </div>
      <div className="h-20 animate-pulse rounded-[14px] bg-black/[0.05]" />
      <div className="flex flex-col gap-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-[20px] bg-black/[0.05]"
          />
        ))}
      </div>
    </main>
  );
}
