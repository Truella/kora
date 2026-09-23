"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "../AuthShell";
import { friendlyAuthError } from "@/lib/auth-errors";
import {
  normalizeToE164,
  InvalidPhoneError,
  MismatchedCountryError,
  COUNTRY_CODES,
  COUNTRY_NAMES,
  type CountryKey,
} from "@/lib/phone";

const COUNTRIES: { key: CountryKey; label: string }[] = [
  { key: "NG", label: "Nigeria (+234)" },
  { key: "KE", label: "Kenya (+254)" },
  { key: "UG", label: "Uganda (+256)" },
  { key: "GH", label: "Ghana (+233)" },
];

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const authError = searchParams.get("error");

  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [country, setCountry] = useState<CountryKey>("NG");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(
    // Callback failures arrive pre-mapped, but map again so a raw
    // ?error= value can never render provider jargon.
    authError ? friendlyAuthError(authError, "link") : null,
  );
  const [sending, setSending] = useState(false);
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);

  async function sendPhoneOtp() {
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
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    setSending(false);
    if (error) {
      setError(friendlyAuthError(error.message, "send"));
      return;
    }
    router.push(
      `/verify?flow=phone&to=${encodeURIComponent(e164)}&next=${encodeURIComponent(next)}`,
    );
  }

  async function sendEmailLink() {
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setSending(false);
    if (error) {
      setError(friendlyAuthError(error.message, "send"));
      return;
    }
    setLinkSentTo(trimmed);
  }

  if (linkSentTo) {
    return (
      <AuthShell
        kicker="Sign in"
        title="Check your inbox"
        intro={
          <>
            We sent a sign-in link to{" "}
            <span className="font-mono font-medium text-ink">
              {linkSentTo}
            </span>
            . Tap it on this device and you&apos;re in — no code to type.
          </>
        }
      >
        <button
          onClick={() => setLinkSentTo(null)}
          className="mt-4 w-full py-2 text-sm font-semibold text-indigo"
        >
          Use a different email
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Sign in"
      title="Join Kora"
      intro={
        tab === "phone"
          ? "Enter your number — we'll text you a 6-digit code."
          : "Enter your email and we'll send a sign-in link. You'll add a phone number after — USSD needs one, the PWA doesn't."
      }
    >

        <div
          role="tablist"
          aria-label="Sign-in method"
          className="grid grid-cols-2 rounded-full bg-mist p-1"
        >
          {(["phone", "email"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setError(null);
              }}
              className={`relative rounded-full py-2 text-sm font-semibold transition-colors ${
                tab === t ? "text-white" : "text-zinc-500"
              }`}
            >
              {tab === t && (
                <motion.span
                  layoutId="login-tab"
                  className="absolute inset-0 rounded-full bg-indigo"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative">
                {t === "phone" ? "Phone" : "Email"}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {tab === "phone" ? (
            <div className="flex gap-2">
              <label className="flex w-32 shrink-0 flex-col gap-1.5">
                <span className="text-sm font-medium">Country</span>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value as CountryKey)}
                  className="rounded-xl border border-black/10 bg-white px-3 py-3 text-[16px] outline-none focus:border-indigo"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      +{COUNTRY_CODES[c.key]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-sm font-medium">
                  Phone · {COUNTRIES.find((c) => c.key === country)?.label}
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="801 234 5678"
                  autoComplete="tel"
                  inputMode="tel"
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[16px] outline-none placeholder:text-zinc-400 focus:border-indigo"
                />
              </label>
            </div>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[16px] outline-none placeholder:text-zinc-400 focus:border-indigo"
              />
            </label>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-clay">
              {error}
            </p>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={sending}
            onClick={tab === "phone" ? sendPhoneOtp : sendEmailLink}
            className="mt-1 rounded-full bg-gold py-3.5 text-sm font-semibold text-ink disabled:opacity-60"
          >
            {sending
              ? tab === "phone"
                ? "Sending code…"
                : "Sending link…"
              : tab === "phone"
                ? "Send code"
                : "Send sign-in link"}
          </motion.button>
        </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
