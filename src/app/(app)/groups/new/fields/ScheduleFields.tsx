const labelClass = "text-sm font-medium text-text-primary";

export function RhythmField({
  frequency,
  onFrequencyChange,
}: {
  frequency: "weekly" | "monthly";
  onFrequencyChange: (frequency: "weekly" | "monthly") => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={labelClass}>Payout rhythm</legend>
      <div className="flex gap-3">
        {(["weekly", "monthly"] as const).map((option) => (
          <label
            key={option}
            className={`flex-1 cursor-pointer rounded-[10px] border-[0.5px] px-4 py-3 text-center text-sm capitalize ${
              frequency === option
                ? "border-primary bg-primary/5 font-medium text-text-primary"
                : "border-border text-text-secondary"
            }`}
          >
            <input
              type="radio"
              name="frequency"
              value={option}
              checked={frequency === option}
              onChange={() => onFrequencyChange(option)}
              className="sr-only"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ThresholdField({
  threshold,
  onThresholdChange,
  error,
}: {
  threshold: number;
  onThresholdChange: (value: number) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="group-threshold" className={labelClass}>
        Votes needed to admit a member:{" "}
        <span className="font-display font-semibold tabular-nums text-text-primary">
          {threshold}%
        </span>
      </label>
      <input
        id="group-threshold"
        type="range"
        min={50}
        max={100}
        step={1}
        value={threshold}
        onChange={(e) => onThresholdChange(Number(e.target.value))}
        className="accent-primary"
      />
      <p className="text-xs text-text-secondary">
        In a circle of 5, {threshold}% means{""}
        {Math.ceil((threshold / 100) * 5)} yes-votes to let someone in.
      </p>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
