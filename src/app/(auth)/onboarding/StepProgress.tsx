import { ONBOARDING_STEPS } from "@/constants/countries";

export function StepProgress({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {ONBOARDING_STEPS.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col gap-1.5">
          <span
            className={`h-1.5 rounded-full ${
              i <= step ? "bg-primary" : "bg-border"
            }`}
          />
          <span
            className={`font-mono text-[11px] font-semibold ${
              i === step ? "text-text-primary" : "text-text-secondary"
            }`}
          >
            {i + 1}. {label}
          </span>
        </div>
      ))}
    </div>
  );
}
