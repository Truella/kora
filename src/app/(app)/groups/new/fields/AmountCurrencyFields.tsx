import Dropdown from "@/components/Dropdown";
import { sanitizeAmountInput, formatAmountDisplay } from "@/lib/inputs";
import { CURRENCIES } from "@/constants/circle";
import type { Currency } from "@/types/circle";

const labelClass = "text-sm font-medium text-text-primary";

export function AmountCurrencyFields({
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  symbol,
  errors,
}: {
  amount: string;
  onAmountChange: (value: string) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  symbol: string;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="group-amount" className={labelClass}>
          Contribution per cycle
        </label>
        <div className="flex items-center rounded-[10px] border-[0.5px] border-border bg-surface focus-within:border-primary">
          <span className="pl-4 font-medium text-text-secondary">{symbol}</span>
          <input
            id="group-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(sanitizeAmountInput(e.target.value))}
            onBlur={() => onAmountChange(formatAmountDisplay(amount))}
            onFocus={() => onAmountChange(amount.replace(/,/g, ""))}
            placeholder="5,000"
            maxLength={16}
            className="w-full rounded-[10px] bg-transparent px-2 py-3 font-display font-semibold tabular-nums text-text-primary outline-none"
          />
        </div>
        {errors.amount && (
          <p className="text-sm font-medium text-danger">{errors.amount}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Currency</span>
        <Dropdown
          value={currency}
          onChange={onCurrencyChange}
          options={CURRENCIES.map((c) => ({
            value: c.code,
            label: `${c.code} · ${c.label}`,
          }))}
          label="Currency"
        />
        <p className="text-xs text-text-secondary">Locked once members join.</p>
      </div>
    </div>
  );
}
