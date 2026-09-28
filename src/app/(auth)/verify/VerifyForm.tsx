"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "../AuthShell";
import { friendlyAuthError } from "@/lib/auth-errors";
import { safeNext } from "@/lib/navigation";

type Flow = "phone" | "add-phone";

export default function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flow: Flow = searchParams.get("flow") === "add-phone" ? "add-phone" : "phone";
  const to = searchParams.get("to") ?? "";
  const next = safeNext(searchParams.get("next"));

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const code = digits.join("");

  if (!to) {
    return (
      <AuthShell
        kicker="Check your texts"
        title="No code to check"
        intro="Start from the sign-in screen so we know where to send the code."
      >
        <Link
          href="/login"
          className="mt-1 w-full py-2 text-center text-sm font-semibold text-text-primary"
        >
          Back to sign in
        </Link>
      </AuthShell>
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

  function focusBox(index: number) {
    inputRefs.current[index]?.focus();
  }

  function onDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    if (!digit && value !== "") return;
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) focusBox(index + 1);
    const joined = next.join("");
    if (joined.length === 6) void verify(joined);
  }

  function onDigitKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && digits[index] === "" && index > 0) {
      e.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      focusBox(index - 1);
    }
  }

  function onDigitPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    focusBox(Math.min(pasted.length, 5));
    if (pasted.length === 6) void verify(pasted);
  }

  return (
    <AuthShell
      kicker={flow === "add-phone" ? "Add a number" : "Verification"}
      title="Check your messages"
      intro={
        <>
          Enter the 6-digit verification code we sent to{" "}
          <span className="font-mono font-medium text-text-primary">{to}</span>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Code</span>
          <div className="grid grid-cols-6 gap-2" role="group" aria-label="6-digit code">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                value={digit}
                onChange={(e) => onDigitChange(i, e.target.value)}
                onKeyDown={(e) => onDigitKeyDown(i, e)}
                onPaste={onDigitPaste}
                placeholder="•"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                autoFocus={i === 0}
                maxLength={1}
                aria-label={`Digit ${i + 1}`}
                className="h-14 rounded-[10px] border-[0.5px] border-border bg-surface text-center font-mono text-2xl text-text-primary outline-none placeholder:text-text-secondary/50 focus:border-primary"
              />
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        {resent && (
          <p className="mt-3 text-sm font-medium text-success">
            New code sent. Give it a minute to arrive.
          </p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={verifying || code.length !== 6}
          onClick={() => verify(code)}
          className="mt-4 w-full rounded-[10px] bg-primary py-[13px] text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {verifying ? "Checking…" : "Verify"}
        </motion.button>

        <button
          onClick={resend}
          className="mt-3 w-full py-2 text-sm font-semibold text-text-primary"
        >
          Resend code
        </button>
    </AuthShell>
  );
}
