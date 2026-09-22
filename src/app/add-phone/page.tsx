"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import {
  normalizeToE164,
  InvalidPhoneError,
  COUNTRY_CODES,
  type CountryKey,
} from "@/lib/phone";

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

function AddPhoneForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [country, setCountry] = useState<CountryKey>("NG");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit() {
    let e164: string;
    try {
      e164 = normalizeToE164(phone, country);
    } catch (err) {
      setError(
        err instanceof InvalidPhoneError
          ? "That number doesn't look right — check the country and try again."
          : "That number doesn't look right.",
      );
      return;
    }
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ phone: e164 });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(
      `/verify?flow=add-phone&to=${encodeURIComponent(e164)}&next=${encodeURIComponent(next)}`,
    );
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo/10 dark:bg-white/10">
          <HugeiconsIcon
            icon={SmartPhone01Icon}
            size={26}
            className="text-indigo dark:text-gold"
          />
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          Add your number
        </h1>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          USSD identifies you by phone — without a verified number, balance
          checks and payment confirmations by USSD can&apos;t find you. The app
          itself works fine without it.
        </p>

        <div className="mt-5 flex gap-2">
          <label className="flex w-24 shrink-0 flex-col gap-1.5">
            <span className="text-sm font-medium">Country</span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryKey)}
              className="rounded-xl border border-black/10 bg-white px-3 py-3 text-[16px] outline-none focus:border-indigo dark:border-white/10 dark:bg-ink"
            >
              {(Object.keys(COUNTRY_CODES) as CountryKey[]).map((key) => (
                <option key={key} value={key}>
                  +{COUNTRY_CODES[key]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium">Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="801 234 5678"
              autoComplete="tel"
              inputMode="tel"
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[16px] outline-none placeholder:text-zinc-400 focus:border-indigo dark:border-white/10 dark:bg-ink"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-clay">
            {error}
          </p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={sending}
          onClick={submit}
          className="mt-4 w-full rounded-full bg-indigo py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {sending ? "Sending code…" : "Send code"}
        </motion.button>

        <Link
          href={next}
          className="mt-1 block w-full py-2 text-center text-sm font-semibold text-zinc-500"
        >
          Skip for now
        </Link>
      </motion.div>
    </main>
  );
}

export default function AddPhonePage() {
  return (
    <Suspense>
      <AddPhoneForm />
    </Suspense>
  );
}
