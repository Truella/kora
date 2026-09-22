"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";

type Flow = "phone" | "add-phone";

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flow: Flow = searchParams.get("flow") === "add-phone" ? "add-phone" : "phone";
  const to = searchParams.get("to") ?? "";
  const next = safeNext(searchParams.get("next"));

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resent, setResent] = useState(false);

  if (!to) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold">No code to check</h1>
        <p className="text-sm text-zinc-500">
          Start from the sign-in screen so we know where to send the code.
        </p>
        <Link href="/login" className="font-semibold text-indigo">
          Back to sign in
        </Link>
      </main>
    );
  }

  async function verify(token: string) {
    setVerifying(true);
    setError(null);
    const supabase = createClient();

    const { data, error } =
      flow === "add-phone"
        ? await supabase.auth.verifyOtp({ phone: to, token, type: "phone_change" })
        : await supabase.auth.verifyOtp({ phone: to, token, type: "sms" });

    if (error || !data.user) {
      setVerifying(false);
      setError(
        error?.message ?? "That code didn't work — check it and try again.",
      );
      return;
    }

    // Anchor the verified E.164 number on the profile.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ phone: to, phone_verified: true })
      .eq("id", data.user.id);
    if (profileError) {
      setVerifying(false);
      setError(
        "Signed in, but we couldn't mark your number verified. Try again from your profile.",
      );
      return;
    }

    // New user (no name yet) → onboarding. Existing user → destination.
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", data.user.id)
      .single();
    setVerifying(false);
    if (profile?.full_name) {
      router.push(next);
    } else {
      router.push(`/onboarding?next=${encodeURIComponent(next)}`);
    }
  }

  async function resend() {
    setError(null);
    setResent(false);
    const supabase = createClient();
    const { error } =
      flow === "add-phone"
        ? await supabase.auth.updateUser({ phone: to })
        : await supabase.auth.signInWithOtp({ phone: to });
    if (error) setError(error.message);
    else setResent(true);
  }

  function onChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6) void verify(digits);
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Check your texts
        </h1>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          6-digit code sent to{" "}
          <span className="font-mono font-medium text-ink dark:text-white">
            {to}
          </span>
        </p>

        <label className="mt-5 flex flex-col gap-1.5">
          <span className="text-sm font-medium">Code</span>
          <input
            value={code}
            onChange={(e) => onChange(e.target.value)}
            placeholder="••••••"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="rounded-xl border border-black/10 bg-white px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] outline-none placeholder:text-zinc-300 focus:border-indigo dark:border-white/10 dark:bg-ink dark:text-white"
          />
        </label>

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-clay">
            {error}
          </p>
        )}
        {resent && (
          <p className="mt-3 text-sm font-medium text-jade">
            New code sent — give it a minute to arrive.
          </p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={verifying || code.length !== 6}
          onClick={() => verify(code)}
          className="mt-4 w-full rounded-full bg-indigo py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {verifying ? "Checking…" : "Verify"}
        </motion.button>

        <button
          onClick={resend}
          className="mt-3 w-full py-2 text-sm font-semibold text-indigo"
        >
          Resend code
        </button>
      </motion.div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
