"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "../AuthShell";
import { friendlyAuthError } from "@/lib/auth-errors";

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
        <p className="text-sm text-indigo/60">
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
      setError(friendlyAuthError(error?.message, "code"));
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
        "Signed in, but we couldn't mark your number verified. Try again from profile.",
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
    if (error) setError(friendlyAuthError(error.message, "send"));
    else setResent(true);
  }

  function onChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6) void verify(digits);
  }

  return (
    <AuthShell
      kicker={flow === "add-phone" ? "Add a number" : "Check your texts"}
      title="Enter your code"
      intro={
        <>
          6-digit code sent to{""}
          <span className="font-mono font-medium text-indigo">{to}</span>
        </>
      }
    >
      <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Code</span>
          <input
            value={code}
            onChange={(e) => onChange(e.target.value)}
            placeholder="••••••"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="rounded-xl border border-indigo/10 bg-paper px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] outline-none placeholder:text-indigo/40 focus:border-indigo"
          />
        </label>

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-indigo">
            {error}
          </p>
        )}
        {resent && (
          <p className="mt-3 text-sm font-medium text-indigo">
            New code sent — give it a minute to arrive.
          </p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={verifying || code.length !== 6}
          onClick={() => verify(code)}
          className="mt-4 w-full rounded-full bg-indigo py-3.5 text-sm font-semibold text-paper hover:bg-indigo-hover disabled:opacity-60"
        >
          {verifying ? "Checking…" : "Verify"}
        </motion.button>

        <button
          onClick={resend}
          className="mt-3 w-full py-2 text-sm font-semibold text-indigo"
        >
          Resend code
        </button>
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
