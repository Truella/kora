"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import Dropdown from "@/components/Dropdown";
import {
  sanitizeAmountInput,
  formatAmountDisplay,
  parseAmount,
} from "@/lib/inputs";
import type { CountryKey } from "@/lib/phone";

type Currency = "NGN" | "GHS" | "KES" | "UGX";

const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: "NGN", symbol: "₦", label: "Naira" },
  { code: "GHS", symbol: "GH₵", label: "Cedi" },
  { code: "KES", symbol: "KSh", label: "Kenyan shilling" },
  { code: "UGX", symbol: "USh", label: "Ugandan shilling" },
];

const COUNTRY_TO_CURRENCY: Record<CountryKey, Currency> = {
  NG: "NGN",
  GH: "GHS",
  KE: "KES",
  UG: "UGX",
};

const TIMEZONE_TO_CURRENCY: Record<string, Currency> = {
  "Africa/Lagos": "NGN",
  "Africa/Accra": "GHS",
  "Africa/Nairobi": "KES",
  "Africa/Kampala": "UGX",
};

function guessCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return TIMEZONE_TO_CURRENCY[tz] ?? "NGN";
  } catch {
    return "NGN";
  }
}

type Status = "idle" | "needs-login";

export default function NewGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>(() => guessCurrency());
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [threshold, setThreshold] = useState(60);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const stored = data.user?.user_metadata?.country as
          | CountryKey
          | undefined;
        const mapped = stored ? COUNTRY_TO_CURRENCY[stored] : undefined;
        if (mapped) {
          setCurrency(mapped);
        }
      });
  }, []);

  const symbol =
    CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (name.trim().length < 3)
      next.name = "Give the circle a name (3+ characters).";
    if (name.trim().length > 60)
      next.name = "Keep the name under 60 characters.";
    if (description.trim().length > 280)
      next.description = "Keep the description under 280 characters.";
    if (!/^\d+(\.\d{1,2})?$/.test(amount.replace(/,/g, "")) || parseAmount(amount) <= 0)
      next.amount = "Enter an amount above zero (max 2 decimals).";
    if (threshold < 50 || threshold > 100)
      next.threshold = "Threshold must be between 50 and 100 percent.";
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problems = validate();
    setErrors(problems);
    setSubmitError(null);
    if (Object.keys(problems).length > 0) {
      setStatus("idle");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("needs-login");
        return;
      }
      const { error } = await supabase.from("groups").insert({
        name: name.trim(),
        description: description.trim() || null,
        contribution_amount: parseAmount(amount),
        currency,
        frequency,
        vote_threshold: threshold / 100,
        created_by: user.id,
      });
      if (error) {
        setSubmitError(
          "Could not save the circle. Check your connection and try again.",
        );
        return;
      }
      router.push("/groups");
    } catch {
      setSubmitError(
        "Could not reach the database. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  const labelClass = "text-sm font-medium text-text-primary";
  const inputClass =
    "rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-3 text-text-primary outline-none focus:border-primary [&>option]:bg-surface [&>option]:text-text-primary";

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary/10">
          <HugeiconsIcon icon={UserGroupIcon} size={20} className="text-primary" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            Create a circle
          </h1>
          <p className="text-sm text-text-secondary">
            Set the terms. The group votes the members in.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-5 rounded-[14px] border-[0.5px] border-border bg-surface p-5"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="group-name" className={labelClass}>
            Circle name
          </label>
          <input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lagos Market Women"
            maxLength={60}
            className={inputClass}
          />
          {errors.name && <p className="text-sm font-medium text-danger">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="group-desc" className={labelClass}>
            Description{""}
            <span className="font-normal text-text-secondary">(optional)</span>
          </label>
          <textarea
            id="group-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={280}
            placeholder="What is this circle saving toward?"
            className={`${inputClass} resize-none`}
          />
          {errors.description && (
            <p className="text-sm font-medium text-danger">{errors.description}</p>
          )}
        </div>

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
                onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
                onBlur={() => setAmount(formatAmountDisplay(amount))}
                onFocus={() => setAmount(amount.replace(/,/g, ""))}
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
            <span className={labelClass}>
              Currency
            </span>
            <Dropdown
              value={currency}
              onChange={setCurrency}
              options={CURRENCIES.map((c) => ({
                value: c.code,
                label: `${c.code} · ${c.label}`,
              }))}
              label="Currency"
            />
            <p className="text-xs text-text-secondary">Locked once members join.</p>
          </div>
        </div>

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
                  onChange={() => setFrequency(option)}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

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
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="accent-primary"
          />
          <p className="text-xs text-text-secondary">
            In a circle of 5, {threshold}% means{""}
            {Math.ceil((threshold / 100) * 5)} yes-votes to let someone in.
          </p>
          {errors.threshold && (
            <p className="text-sm font-medium text-danger">{errors.threshold}</p>
          )}
        </div>

        {status === "needs-login" && (
          <p className="rounded-[10px] bg-[#F8EDD9] px-4 py-3 text-sm text-[#8A5F14]">
            Everything above checks out.{" "}
            <Link
              href="/login?next=/groups/new"
              className="font-medium text-text-primary underline"
            >
              log in
            </Link>{""}
            to save it.
          </p>
        )}
        {submitError && (
          <p className="rounded-[10px] bg-[#F3E1E0] px-4 py-3 text-sm text-[#8A2A21]">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? "Saving…" : "Create circle"}
          {!saving && <HugeiconsIcon icon={ArrowRight01Icon} size={18} />}
        </button>
      </form>
    </main>
  );
}
