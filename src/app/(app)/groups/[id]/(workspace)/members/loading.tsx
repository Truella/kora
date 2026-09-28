export default function MembersLoading() {
  return (
    <section aria-hidden="true" className="animate-pulse overflow-hidden rounded-[20px] border-[0.5px] border-border bg-surface">
      <div className="flex items-center gap-2 px-4 pb-1 pt-4">
        <div className="h-5 w-20 rounded-[8px] bg-black/[0.05]" />
        <div className="h-5 w-7 rounded-full bg-black/[0.05]" />
      </div>
      <div className="divide-y divide-border px-2 pb-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2.5">
            <div className="h-8 w-8 shrink-0 rounded-full bg-black/[0.05]" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="h-4 w-32 max-w-full rounded-[8px] bg-black/[0.05]" />
              <div className="h-3 w-56 max-w-full rounded-[8px] bg-black/[0.05]" />
            </div>
            <div className="h-6 w-16 shrink-0 rounded-full bg-black/[0.05]" />
          </div>
        ))}
      </div>
    </section>
  );
}
