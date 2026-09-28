const labelClass = "text-sm font-medium text-text-primary";
const inputClass =
  "rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-3 text-text-primary outline-none focus:border-primary [&>option]:bg-surface [&>option]:text-text-primary";

export function CircleNameFields({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  errors,
}: {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="group-name" className={labelClass}>
          Circle name
        </label>
        <input
          id="group-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Lagos Market Women"
          maxLength={60}
          className={inputClass}
        />
        {errors.name && (
          <p className="text-sm font-medium text-danger">{errors.name}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="group-desc" className={labelClass}>
          Description{""}
          <span className="font-normal text-text-secondary">(optional)</span>
        </label>
        <textarea
          id="group-desc"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={2}
          maxLength={280}
          placeholder="What is this circle saving toward?"
          className={`${inputClass} resize-none`}
        />
        {errors.description && (
          <p className="text-sm font-medium text-danger">
            {errors.description}
          </p>
        )}
      </div>
    </>
  );
}
