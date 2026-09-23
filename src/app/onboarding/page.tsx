"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "../AuthShell";
import { COUNTRY_CODES, type CountryKey } from "@/lib/phone";

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

const COUNTRIES: { key: CountryKey; name: string }[] = [
  { key: "NG", name: "Nigeria" },
  { key: "KE", name: "Kenya" },
  { key: "UG", name: "Uganda" },
  { key: "GH", name: "Ghana" },
];

const STEP_LABELS = ["Your name", "Home country", "Review"];

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [country, setCountry] = useState<CountryKey>("NG");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function continueFromName() {
    if (name.trim().length < 2) {
      setError("Tell us your name — your circle members will see it.");
      return;
    }
    setError(null);
    setStep(1);
  }

  async function submit() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setStep(0);
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

  const chosen = COUNTRIES.find((c) => c.key === country);

  return (
    <AuthShell
      kicker="Onboarding"
      title="You're in."
      intro="Three quick steps — this is the profile your circle members will see."
    >
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={`h-1.5 rounded-full ${
                i <= step ? "bg-gold" : "bg-black/10"
              }`}
            />
            <span
              className={`text-[11px] font-semibold ${
                i === step ? "text-ink" : "text-zinc-400"
              }`}
            >
              {i + 1}. {label}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="mt-5 flex flex-col gap-3"
        >
          {step === 0 && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Full name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adaeze Okafor"
                  autoComplete="name"
                  autoFocus
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[16px] outline-none placeholder:text-zinc-400 focus:border-indigo"
                />
              </label>
              <p className="text-xs leading-5 text-zinc-500">
                Shows on invites, votes, and the ledger.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Home country">
                {COUNTRIES.map((c) => {
                  const selected = c.key === country;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setCountry(c.key)}
                      className={`flex flex-col rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                        selected
                          ? "border-gold bg-gold/10"
                          : "border-black/10 bg-white"
                      }`}
                    >
                      <span className="text-sm font-semibold text-ink">
                        {c.name}
                      </span>
                      <span className="font-mono text-xs text-zinc-500">
                        +{COUNTRY_CODES[c.key]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs leading-5 text-zinc-500">
                Sets your default dial code and currency.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <dl className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm text-zinc-500">Name</dt>
                  <dd className="text-sm font-semibold text-ink">
                    {name.trim()}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-black/5 pt-2">
                  <dt className="text-sm text-zinc-500">Home country</dt>
                  <dd className="text-sm font-semibold text-ink">
                    {chosen?.name} (+{chosen && COUNTRY_CODES[chosen.key]})
                  </dd>
                </div>
              </dl>
              <p className="text-xs leading-5 text-zinc-500">
                Looks right? Circle members will recognize you by this name.
              </p>
            </>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-clay">
              {error}
            </p>
          )}

          <div className="mt-1 flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(step - 1);
                }}
                className="rounded-full border border-black/10 px-6 py-3.5 text-sm font-semibold text-ink"
              >
                Back
              </button>
            )}
            {step < 2 ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => (step === 0 ? continueFromName() : setStep(2))}
                className="flex-1 rounded-full bg-gold py-3.5 text-sm font-semibold text-ink"
              >
                Continue
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                disabled={saving}
                onClick={submit}
                className="flex-1 rounded-full bg-gold py-3.5 text-sm font-semibold text-ink disabled:opacity-60"
              >
                {saving ? "Saving…" : "Finish setup"}
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </AuthShell>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  );
}
