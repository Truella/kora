"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { type CountryKey } from "@/lib/phone";

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [name, setName] = useState("");
  const [country, setCountry] = useState<CountryKey>("NG");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Tell us your name — your circle members will see it.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("id", user.id);
    if (profileError) {
      setSaving(false);
      setError(profileError.message);
      return;
    }
    // Remember home country for future defaults (dial code, currency).
    await supabase.auth.updateUser({ data: { full_name: trimmed, country } });

    const { data: profile } = await supabase
      .from("profiles")
      .select("phone_verified")
      .eq("id", user.id)
      .single();
    setSaving(false);
    if (profile?.phone_verified) {
      router.push(next);
    } else {
      router.push(`/add-phone?next=${encodeURIComponent(next)}`);
    }
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          You&apos;re in. Who are you?
        </h1>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Your name is how circle members recognize you — it shows on invites,
          votes, and the ledger.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Full name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adaeze Okafor"
              autoComplete="name"
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[16px] outline-none placeholder:text-zinc-400 focus:border-indigo dark:border-white/10 dark:bg-ink dark:text-white"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Home country</span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryKey)}
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[16px] outline-none focus:border-indigo dark:border-white/10 dark:bg-ink dark:text-white"
            >
              <option value="NG">Nigeria</option>
              <option value="KE">Kenya</option>
              <option value="UG">Uganda</option>
              <option value="GH">Ghana</option>
            </select>
          </label>

          {error && (
            <p role="alert" className="text-sm font-medium text-clay">
              {error}
            </p>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={saving}
            onClick={submit}
            className="mt-1 rounded-full bg-indigo py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Continue"}
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  );
}
