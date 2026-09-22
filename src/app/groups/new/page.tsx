"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";

type Currency = "NGN" | "GHS" | "KES" | "UGX";

const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: "NGN", symbol: "₦", label: "Naira" },
  { code: "GHS", symbol: "GH₵", label: "Cedi" },
  { code: "KES", symbol: "KSh", label: "Kenyan shilling" },
  { code: "UGX", symbol: "USh", label: "Ugandan shilling" },
];

const TIMEZONE_TO_CURRENCY: Record<string, Currency> = {
  "Africa/Lagos": "NGN",
  "Africa/Accra": "GHS",
  "Africa/Nairobi": "KES",
  "Africa/Kampala": "UGX",
};

// Suggestion only — the dropdown is the source of truth, never the guess.
function guessCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return TIMEZONE_TO_CURRENCY[tz] ?? "NGN";
  } catch {
    return "NGN";
  }
}

type Status = "idle" | "needs-login" | "created";

export default function NewGroupPage() {
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
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim()) || Number(amount) <= 0)
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
        // RLS only accepts groups where created_by = the logged-in user.
        setStatus("needs-login");
        return;
      }
      // vote_threshold is numeric(3,2): slider percent → fraction.
      const { error } = await supabase.from("groups").insert({
        name: name.trim(),
        description: description.trim() || null,
        contribution_amount: Number(amount),
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
      // handle_new_group trigger adds the creator as member 1 automatically.
      setStatus("created");
    } catch {
      setSubmitError(
        "Could not reach the database. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setName("");
    setDescription("");
    setAmount("");
    setCurrency(guessCurrency());
    setFrequency("weekly");
    setThreshold(60);
    setErrors({});
    setSubmitError(null);
    setStatus("idle");
  }

  if (status === "created") {
    return (
      <main className="flex flex-1 flex-col items-center px-8 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-jade/10">
          <HugeiconsIcon icon={CheckmarkBadge01Icon} size={28} className="text-jade" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
          {name.trim()} is live
        </h1>
        <p className="mt-2 max-w-xs font-mono text-sm text-ink dark:text-white">
          {symbol}
          {Number(amount).toLocaleString()} {currency} · {frequency}
        </p>
        <p className="mt-1 max-w-xs text-sm leading-6 text-zinc-500">
          {threshold}% vote to admit · you are member 1.
        </p>
        <p className="mt-1 max-w-xs text-sm leading-6 text-zinc-500">
          Member invites open next — there is no link to share yet.
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            href="/groups"
            className="rounded-full border border-black/10 px-6 py-2.5 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            View circles
          </Link>
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-indigo px-6 py-2.5 text-sm font-medium text-white"
          >
            Create another
          </button>
        </div>
      </main>
    );
  }

  const inputClass =
    "rounded-xl border border-black/10 bg-white px-4 py-3 text-ink outline-none focus:border-indigo dark:border-white/10 dark:bg-white/5 dark:text-white";

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo/10 dark:bg-white/10">
          <HugeiconsIcon icon={UserGroupIcon} size={20} className="text-indigo dark:text-gold" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Create a circle
          </h1>
          <p className="text-sm text-zinc-500">
            Set the terms — the group votes the members in.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-5 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-ink"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="group-name" className="text-sm font-medium">
            Circle name
          </label>
          <input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lagos Market Women"
            className={inputClass}
          />
          {errors.name && <p className="text-sm text-clay">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="group-desc" className="text-sm font-medium">
            Description{" "}
            <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <textarea
            id="group-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What is this circle saving toward?"
            className={inputClass}
          />
          {errors.description && (
            <p className="text-sm text-clay">{errors.description}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="group-amount" className="text-sm font-medium">
              Contribution per cycle
            </label>
            <div className="flex items-center rounded-xl border border-black/10 bg-white focus-within:border-indigo dark:border-white/10 dark:bg-white/5">
              <span className="pl-4 font-medium text-zinc-500">{symbol}</span>
              <input
                id="group-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5,000"
                className="w-full rounded-xl bg-transparent px-2 py-3 font-mono text-ink outline-none dark:text-white"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-clay">{errors.amount}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="group-currency" className="text-sm font-medium">
              Currency
            </label>
            <select
              id="group-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className={inputClass}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-400">Locked once members join.</p>
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Payout rhythm</legend>
          <div className="flex gap-3">
            {(["weekly", "monthly"] as const).map((option) => (
              <label
                key={option}
                className={`flex-1 cursor-pointer rounded-xl border px-4 py-3 text-center text-sm capitalize ${
                  frequency === option
                    ? "border-indigo bg-indigo/5 font-medium text-indigo dark:text-gold"
                    : "border-black/10 text-zinc-500 dark:border-white/10"
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
          <label htmlFor="group-threshold" className="text-sm font-medium">
            Votes needed to admit a member —{" "}
            <span className="font-mono text-indigo dark:text-gold">
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
            className="accent-[#26306B]"
          />
          <p className="text-xs text-zinc-400">
            In a circle of 5, {threshold}% means{" "}
            {Math.ceil((threshold / 100) * 5)} yes-votes to let someone in.
          </p>
          {errors.threshold && (
            <p className="text-sm text-clay">{errors.threshold}</p>
          )}
        </div>

        {status === "needs-login" && (
          <p className="rounded-xl bg-gold/15 px-4 py-3 text-sm">
            Everything above checks out —{" "}
            <Link
              href="/login?next=/groups/new"
              className="font-medium text-indigo underline dark:text-gold"
            >
              log in
            </Link>{" "}
            to save it.
          </p>
        )}
        {submitError && (
          <p className="rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {saving ? "Saving…" : "Create circle"}
          {!saving && <HugeiconsIcon icon={ArrowRight01Icon} size={18} />}
        </button>
      </form>
    </main>
  );
}
