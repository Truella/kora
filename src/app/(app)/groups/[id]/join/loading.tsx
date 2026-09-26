export default function JoinLoading() {
  return (
    <main className="flex flex-1 flex-col items-center px-8 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-[20px] border-[0.5px] border-border bg-surface p-6">
        <div className="h-12 w-12 animate-pulse rounded-[14px] bg-black/[0.05]" />
        <div className="h-7 w-48 animate-pulse rounded-[8px] bg-black/[0.05]" />
        <div className="h-4 w-64 animate-pulse rounded-[8px] bg-black/[0.05]" />
        <div className="mt-2 h-[52px] w-full animate-pulse rounded-[10px] bg-black/[0.05]" />
      </div>
    </main>
  );
}
