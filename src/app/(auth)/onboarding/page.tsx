"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "../AuthShell";
import { COUNTRY_CODES, type CountryKey } from "@/lib/phone";
import { uploadAvatar, validateAvatarFile } from "@/lib/avatar";

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/home";
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function pickAvatar(file: File | undefined) {
    if (!file) return;
    const invalid = validateAvatarFile(file);
    if (invalid) {
      setAvatarError(invalid);
      return;
    }
    setAvatarError(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function removeAvatar() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  function continueFromName() {
    if (name.trim().length < 2) {
      setError("Tell us your name — circle members will see it.");
      return;
    }
    setError(null);
    setStep(1);
  }

  async function submit() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setStep(0);
      setError("Tell us your name — circle members will see it.");
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
    // Optional photo: upload now, point avatar_url at it. A failed upload
    // doesn't lose the name — stay here so they can retry or remove + skip.
    if (avatarFile) {
      try {
        const publicUrl = await uploadAvatar(supabase, user.id, avatarFile);
        const { error: avatarError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", user.id);
        if (avatarError) throw new Error("Photo uploaded, but couldn't save it.");
      } catch (e) {
        setSaving(false);
        setAvatarError(
          e instanceof Error ? e.message : "Couldn't upload that photo — try again.",
        );
        setStep(0);
        return;
      }
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
                i <= step ? "bg-primary" : "bg-border"
              }`}
            />
            <span
              className={`font-mono text-[11px] font-semibold ${
                i === step ? "text-text-primary" : "text-text-secondary"
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
                  className="rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-3 text-[16px] text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-primary"
                />
              </label>
              <p className="text-xs leading-5 text-text-secondary">
                Shows on invites, votes, and the ledger.
              </p>
              <div className="flex items-center gap-3">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Your profile photo preview"
                    width={48}
                    height={48}
                    unoptimized
                    className="h-12 w-12 shrink-0 rounded-[10px] object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 font-display text-sm font-semibold text-primary">
                    {name.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    Profile photo <span className="font-normal text-text-secondary">(optional)</span>
                  </p>
                  <p className="text-xs text-text-secondary">JPG, PNG, or WebP under 2MB.</p>
                  {avatarError && (
                    <p role="alert" className="mt-0.5 text-xs font-medium text-danger">
                      {avatarError}
                    </p>
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  aria-label="Choose a profile photo"
                  onChange={(e) => pickAvatar(e.target.files?.[0])}
                />
                {avatarPreview ? (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="shrink-0 rounded-[10px] border-[0.5px] border-border bg-white px-4 py-2 text-xs font-semibold text-text-primary"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="shrink-0 rounded-[10px] border-[0.5px] border-border bg-white px-4 py-2 text-xs font-semibold text-text-primary"
                  >
                    Add
                  </button>
                )}
              </div>
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
          )}

          {step === 2 && (
            <>
              <dl className="flex flex-col gap-2 rounded-[14px] border-[0.5px] border-border bg-surface p-4">
                {avatarPreview && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-sm text-text-secondary">Photo</dt>
                    <dd>
                      <Image
                        src={avatarPreview}
                        alt="Your profile photo preview"
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 rounded-[10px] object-cover"
                      />
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm text-text-secondary">Name</dt>
                  <dd className="text-sm font-semibold text-text-primary">
                    {name.trim()}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                  <dt className="text-sm text-text-secondary">Home country</dt>
                  <dd className="text-sm font-semibold text-text-primary">
                    {chosen?.name} (+{chosen && COUNTRY_CODES[chosen.key]})
                  </dd>
                </div>
              </dl>
              <p className="text-xs leading-5 text-text-secondary">
                Looks right? Circle members will recognize you by this name.
              </p>
            </>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}

          <div className="mt-1 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(step - 1);
                }}
                className="rounded-[10px] border-[0.5px] border-border bg-white px-6 py-[13px] text-sm font-semibold text-text-primary"
              >
                Back
              </button>
            )}
            {step < 2 ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => (step === 0 ? continueFromName() : setStep(2))}
                className="flex-1 rounded-[10px] bg-primary py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Continue
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                disabled={saving}
                onClick={submit}
                className="flex-1 rounded-[10px] bg-primary py-[13px] text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
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
