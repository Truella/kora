import { COUNTRY_OPTIONS } from "@/constants/countries";
import { COUNTRY_CODES, type CountryKey } from "@/lib/phone";

export function CountryStep({
  country,
  onCountryChange,
}: {
  country: CountryKey;
  onCountryChange: (country: CountryKey) => void;
}) {
  return (
    <>
      <div
        className="grid grid-cols-2 gap-2"
        role="radiogroup"
        aria-label="Home country"
      >
        {COUNTRY_OPTIONS.map((c) => {
          const selected = c.key === country;
          return (
            <button
              key={c.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onCountryChange(c.key)}
              className={`flex flex-col rounded-[14px] border-[0.5px] px-4 py-3 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface"
              }`}
            >
              <span className="text-sm font-semibold text-text-primary">
                {c.name}
              </span>
              <span className="font-mono text-xs text-text-secondary">
                +{COUNTRY_CODES[c.key]}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-5 text-text-secondary">
        Sets your default dial code and currency.
      </p>
    </>
  );
}
