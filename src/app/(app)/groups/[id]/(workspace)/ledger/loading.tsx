export default function LedgerLoading() {
  return (
    <div aria-hidden="true" className="animate-pulse rounded-[12px] bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,20,0.06),0_8px_24px_-16px_rgba(16,24,20,0.18)] sm:p-6">
      <div className="mb-4 h-3 w-40 rounded-[8px] bg-black/[0.05]" />
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`rounded-[12px] bg-bg px-3 py-2.5 ${i === 4 ? "hidden sm:block" : ""}`}>
            <div className="h-3 w-16 rounded-[8px] bg-black/[0.05]" />
            <div className="mt-2 h-5 w-24 max-w-full rounded-[8px] bg-black/[0.05]" />
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-[12px] border border-border">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-5 gap-3 border-b-2 border-border p-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-20 rounded-[8px] bg-black/[0.05]" />
            ))}
          </div>
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="grid grid-cols-5 gap-3 border-b border-border p-3.5 last:border-0">
              {[0, 1, 2, 3, 4].map((cell) => (
                <div key={cell} className="h-5 w-16 rounded-[8px] bg-black/[0.05]" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
