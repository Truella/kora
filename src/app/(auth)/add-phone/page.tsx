"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "../../AuthShell";
import Dropdown from "../../Dropdown";
import { sanitizePhoneInput, MAX_PHONE_LEN } from "@/lib/inputs";
import { friendlyAuthError } from "@/lib/auth-errors";
import {
  normalizeToE164,
  InvalidPhoneError,
  MismatchedCountryError,
  COUNTRY_CODES,
  COUNTRY_NAMES,
  type CountryKey,
} from "@/lib/phone";

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/home";
}

function AddPhoneForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [country, setCountry] = useState<CountryKey>("NG");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Signed-in users already told us their home country at onboarding —
  // default the dial code to it (mount-only, never clobbers a pick).
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const stored = data.user?.user_metadata?.country as
          | CountryKey
          | undefined;
        if (stored && COUNTRY_CODES[stored]) setCountry(stored);
      });
  }, []);

  async function submit() {
    let e164: string;
    try {
      e164 = normalizeToE164(phone, country);
    } catch (err) {
      if (err instanceof MismatchedCountryError) {
        setError(
          `That looks like a ${COUNTRY_NAMES[err.detected]} number — switch the country selector to ${COUNTRY_NAMES[err.detected]} (+${COUNTRY_CODES[err.detected]}).`,
        );
      } else {
        setError(
          err instanceof InvalidPhoneError
            ? "That number doesn't look right — check the country and try again."
            : "That number doesn't look right.",
        );
      }
      return;
    }
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ phone: e164 });
    setSending(false);
    if (error) {
      setError(friendlyAuthError(error.message, "send"));
      return;
    }
    router.push(
      `/verify?flow=add-phone&to=${encodeURIComponent(e164)}&next=${encodeURIComponent(next)}`,
    );
  }

  return (
    <AuthShell
      kicker="USSD access"
      title="Add your number"
      intro="USSD identifies you by phone — without a verified number, balance checks and payment confirmations can't find you. The app itself works fine it."
    >
      <div className="flex gap-2">
          <div className="flex w-24 shrink-0 flex-col gap-1.5">
            <span className="text-sm font-medium">Country</span>
            <Dropdown
              value={country}
              onChange={setCountry}
              options={(Object.keys(COUNTRY_CODES) as CountryKey[]).map(
                (key) => ({ value: key, label: `+${COUNTRY_CODES[key]}` }),
              )}
              label="Country"
            />
          </div>
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium">Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
              placeholder="801 234 5678"
              autoComplete="tel"
              inputMode="tel"
              maxLength={MAX_PHONE_LEN}
              className="rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-3 text-[16px] text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-primary"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={sending}
          onClick={submit}
          className="mt-4 w-full rounded-[10px] bg-primary py-[13px] text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {sending ? "Sending code…" : "Send code"}
        </motion.button>

        <Link
          href={next}
          className="mt-1 block w-full py-2 text-center text-sm font-semibold text-text-secondary"
        >
          Skip for now
        </Link>
    </AuthShell>
  );
}

export default function AddPhonePage() {
  return (
    <Suspense>
      <AddPhoneForm />
    </Suspense>
  );
}
