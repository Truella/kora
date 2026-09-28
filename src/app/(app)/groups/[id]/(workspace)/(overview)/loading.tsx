export default function OverviewLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5 animate-pulse">
      <div className="rounded-[20px] bg-primary p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="h-6 w-20 rounded-[8px] bg-white/20" />
          <div className="h-6 w-24 rounded-full bg-white/20" />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="h-3 w-32 rounded-[8px] bg-white/20" />
            <div className="h-8 w-36 rounded-[8px] bg-white/20" />
            <div className="h-3 w-24 rounded-[8px] bg-white/20" />
          </div>
          <div className="flex flex-col gap-3 rounded-[12px] bg-white/10 p-3.5">
            <div className="h-3 w-20 rounded-[8px] bg-white/20" />
            <div className="h-8 w-36 rounded-[8px] bg-white/20" />
            <div className="h-3 w-28 rounded-[8px] bg-white/20" />
          </div>
        </div>
        <div className="mt-5 h-3 w-40 rounded-[8px] bg-white/20" />
        <div className="mt-2 h-1.5 rounded-full bg-white/20" />
      </div>
      <section className="flex flex-col gap-3">
        <div className="h-6 w-36 rounded-[8px] bg-black/[0.05]" />
        <div className="overflow-hidden rounded-[14px] border-[0.5px] border-border bg-surface px-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border py-4 last:border-0">
              <div className="h-9 w-9 shrink-0 rounded-full bg-black/[0.05]" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-2/3 rounded-[8px] bg-black/[0.05]" />
                <div className="h-3 w-1/3 rounded-[8px] bg-black/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
