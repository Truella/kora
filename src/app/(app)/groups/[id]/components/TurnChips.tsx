export function DueChip({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[#F8EDD9] px-2.5 py-0.5 text-[11px] font-semibold text-[#8A5F14]">
      {label}
    </span>
  );
}

export function SettledChip({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[#E0ECE9] px-2.5 py-0.5 text-[11px] font-semibold text-[#1E5A4E]">
      {label}
    </span>
  );
}
