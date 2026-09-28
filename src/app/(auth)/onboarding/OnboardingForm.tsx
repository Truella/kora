"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "../AuthShell";
import { type CountryKey } from "@/lib/phone";
import { safeNext } from "@/lib/navigation";
import { uploadAvatar, validateAvatarFile } from "@/lib/avatar";
import { StepProgress } from "./StepProgress";
import { NameStep } from "./steps/NameStep";
import { CountryStep } from "./steps/CountryStep";
import { ReviewStep } from "./steps/ReviewStep";

export default function OnboardingForm() {
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
      setError("Tell us your name. Circle members will see it.");
      return;
    }
    setError(null);
    setStep(1);
  }

  async function submit() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setStep(0);
      setError("Tell us your name. Circle members will see it.");
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
          e instanceof Error ? e.message : "Couldn't upload that photo. Try again.",
        );
        setStep(0);
        return;
      }
    }
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
    <AuthShell
      kicker="Onboarding"
      title="You're in."
      intro="Three quick steps. This is the profile your circle members will see."
    >
      <StepProgress step={step} />

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
            <NameStep
              name={name}
              onNameChange={setName}
              avatarPreview={avatarPreview}
              avatarError={avatarError}
              onPickAvatar={pickAvatar}
              onRemoveAvatar={removeAvatar}
              avatarInputRef={avatarInputRef}
            />
          )}

          {step === 1 && (
            <CountryStep country={country} onCountryChange={setCountry} />
          )}

          {step === 2 && (
            <ReviewStep
              name={name}
              country={country}
              avatarPreview={avatarPreview}
            />
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
