"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import Dropdown from "../../../Dropdown";
import { sanitizePhoneInput, MAX_PHONE_LEN } from "@/lib/inputs";
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

// Direct invite by verified phone. Anonymous link invites (InviteButton) stay
// the path for people without an account; this one files an addressed
// circle_invites row so an existing user gets a nudge on /home instead of
// needing a forwarded link. Both funnels end at join_requests + the member
// vote — this never admits anyone directly.
//
// No directory lookup: the number is stored E.164 and matched server-side
// against the invitee's own verified phone, so sending reveals nothing about
// whether the number has an account. A number with no account yet simply sees
// nothing until they sign up with it (share the link for those cases).
export default function InviteByPhone({
  groupId,
  bare = false,
}: {
  groupId: string;
  bare?: boolean;
}) {
  const [country, setCountry] = useState<CountryKey>("NG");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<
    "idle" | "sending" | "sent" | "duplicate" | "member" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  async function send() {
    let e164: string;
    try {
      e164 = normalizeToE164(phone, country);
    } catch (err) {
      if (err instanceof MismatchedCountryError) {
        setError(
          `That looks like a ${COUNTRY_NAMES[err.detected]} number. Switch the country selector to ${COUNTRY_NAMES[err.detected]} (+${COUNTRY_CODES[err.detected]}).`,
        );
      } else {
        setError(
          err instanceof InvalidPhoneError
            ? "That number doesn't look right. Check the country and try again."
            : "That number doesn't look right.",
        );
      }
      return;
    }
    setState("sending");
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState("error");
        setError("You signed out. Sign back in and try again.");
        return;
      }
      const { error: insertError } = await supabase
        .from("circle_invites")
        .insert({
          group_id: groupId,
          inviter_user_id: user.id,
          invitee_phone: e164,
        });
      if (!insertError) {
        setState("sent");
        setPhone("");
        return;
      }
      // Partial unique (group_id, invitee_phone) where pending — a live
      // nudge already exists for this number.
      if (insertError.code === "23505") {
        setState("duplicate");
        return;
      }
      // BEFORE-INSERT trigger: the number already belongs to an active
      // member of this circle.
      if (
        insertError.code === "P0001" ||
        insertError.message.includes("already_member")
      ) {
        setState("member");
        return;
      }
      setState("error");
      setError("Could not send the invite. Check your connection and try again.");
    } catch {
      setState("error");
      setError("Could not send the invite. Check your connection and try again.");
    }
  }

  return (
    <div
      className={
        bare
          ? "flex flex-col gap-3"
          : "flex flex-col gap-3 rounded-[14px] border-[0.5px] border-border bg-surface p-4"
      }
    >
      <div>
      {!bare && (
        <h2 className="font-display text-base font-semibold text-text-primary">
          Invite by phone number
        </h2>
      )}
      </div>

      {state === "sent" ? (
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-success"
          >
            <HugeiconsIcon
              icon={Tick01Icon}
              size={26}
              className="text-white"
            />
          </motion.span>
          <p className="text-sm font-semibold text-text-primary">
            Invite sent
          </p>
        </div>
      ) : state === "duplicate" ? (
        <p className="rounded-[10px] bg-[#F8EDD9] px-4 py-3 text-sm leading-6 text-[#8A5F14]">
          That number already has a pending invite to this circle.
        </p>
      ) : state === "member" ? (
        <p className="rounded-[10px] bg-[#F8EDD9] px-4 py-3 text-sm leading-6 text-[#8A5F14]">
          That number already belongs to this circle.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex w-28 shrink-0 flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">
                Country
              </span>
              <Dropdown
                value={country}
                onChange={setCountry}
                options={COUNTRIES.map((c) => ({
                  value: c.key,
                  label: `+${COUNTRY_CODES[c.key]}`,
                }))}
                label="Country"
                tone="white"
                dropUp
              />
            </div>
            <label className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">
                Phone · {COUNTRIES.find((c) => c.key === country)?.label}
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                placeholder="801 234 5678"
                autoComplete="tel"
                inputMode="tel"
                maxLength={MAX_PHONE_LEN}
                className="rounded-[10px] border-[0.5px] border-border bg-white px-4 py-3 text-[16px] text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-primary"
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          {state === "error" && !error && (
            <p role="alert" className="text-sm font-medium text-danger">
              Could not send the invite. Check your connection and try again.
            </p>
          )}
          <motion.button
            type="button"
            onClick={send}
            disabled={state === "sending"}
            whileTap={{ scale: 0.97 }}
            className="rounded-[10px] bg-primary px-6 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Send invite"}
          </motion.button>
        </div>
      )}
    </div>
  );
}
