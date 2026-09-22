"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import {
  normalizeToE164,
  InvalidPhoneError,
  COUNTRY_CODES,
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

  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [country, setCountry] = useState<CountryKey>("NG");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function sendPhoneOtp() {
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
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: { data: { full_name: name.trim() } },
    });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(
      `/verify?flow=phone&to=${encodeURIComponent(e164)}&next=${encodeURIComponent(next)}`,
    );
  }

  async function sendEmailOtp() {
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
      options: { data: { full_name: name.trim() } },
    });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(
      `/verify?flow=email&to=${encodeURIComponent(trimmed)}&next=${encodeURIComponent(next)}`,
    );
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-1 flex-col"
      >
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Join Kora
        </h1>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {tab === "phone"
            ? "Enter your number — we'll text you a 6-digit code."
            : "Enter your email for a code. You'll add a phone number after — USSD needs one, the PWA doesn't."}
        </p>

        <div
          role="tablist"
          aria-label="Sign-in method"
          className="mt-5 grid grid-cols-2 rounded-full bg-black/5 p-1 dark:bg-white/10"
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
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Your name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adaeze Okafor"
              autoComplete="name"
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[16px] outline-none placeholder:text-zinc-400 focus:border-indigo dark:border-white/10 dark:bg-ink"
            />
          </label>

          {tab === "phone" ? (
            <div className="flex gap-2">
              <label className="flex w-32 shrink-0 flex-col gap-1.5">
                <span className="text-sm font-medium">Country</span>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value as CountryKey)}
                  className="rounded-xl border border-black/10 bg-white px-3 py-3 text-[16px] outline-none focus:border-indigo dark:border-white/10 dark:bg-ink"
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
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[16px] outline-none placeholder:text-zinc-400 focus:border-indigo dark:border-white/10 dark:bg-ink"
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
                className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[16px] outline-none placeholder:text-zinc-400 focus:border-indigo dark:border-white/10 dark:bg-ink"
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
            onClick={tab === "phone" ? sendPhoneOtp : sendEmailOtp}
            className="mt-1 rounded-full bg-indigo py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Sending code…" : "Send code"}
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
