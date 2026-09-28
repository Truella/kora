"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import { parseAmount } from "@/lib/inputs";
import type { CountryKey } from "@/lib/phone";
import { COUNTRY_TO_CURRENCY, CURRENCIES } from "@/constants/circle";
import { guessCurrency } from "@/lib/circles";
import type { Currency } from "@/types/circle";
import { validateGroup } from "./validateGroup";
import { CircleNameFields } from "./fields/CircleNameFields";
import { AmountCurrencyFields } from "./fields/AmountCurrencyFields";
import { RhythmField, ThresholdField } from "./fields/ScheduleFields";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problems = validateGroup({ name, description, amount, threshold });
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
        <CircleNameFields
          name={name}
          onNameChange={setName}
          description={description}
          onDescriptionChange={setDescription}
          errors={errors}
        />

        <AmountCurrencyFields
          amount={amount}
          onAmountChange={setAmount}
          currency={currency}
          onCurrencyChange={setCurrency}
          symbol={symbol}
          errors={errors}
        />

        <RhythmField frequency={frequency} onFrequencyChange={setFrequency} />

        <ThresholdField
          threshold={threshold}
          onThresholdChange={setThreshold}
          error={errors.threshold}
        />

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
