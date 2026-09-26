"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/auth-errors";
import AvatarUploader from "./AvatarUploader";

// Form half of the profile hero. Display (avatar, name, stats) lives in
// ProfileHero, which owns the editing toggle — this component only handles
// the photo/name/email fields and reports close requests upward.
export default function ProfileEditorForm({
  userId,
  currentName,
  currentAvatarUrl,
  currentEmail,
  onClose,
}: {
  userId: string;
  currentName: string;
  currentAvatarUrl: string | null;
  currentEmail: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);

  // A fresh server snapshot (router.refresh() after a photo upload)
  // must win over the draft seeded at mount.
  const [synced, setSynced] = useState({
    name: currentName,
    url: currentAvatarUrl,
    email: currentEmail,
  });
  if (
    currentName !== synced.name ||
    currentAvatarUrl !== synced.url ||
    currentEmail !== synced.email
  ) {
    setSynced({ name: currentName, url: currentAvatarUrl, email: currentEmail });
    setName(currentName);
    // A newly linked address arrives via refresh — clear the pending state.
    if (currentEmail !== synced.email) setLinkSentTo(null);
  }

  async function linkEmail() {
    const trimmed = email.trim();
    if (!trimmed.includes("@") || linking) return;
    setLinking(true);
    setLinkError(null);
    try {
      const supabase = createClient();
      // Phone-first accounts gain a second sign-in path. Supabase emails
      // a confirmation to the new address; the link lands on the shared
      // /auth/callback, which routes by profile state, then /profile shows
      // it as linked after refresh.
      const { error: updateError } = await supabase.auth.updateUser(
        { email: trimmed },
        {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        },
      );
      if (updateError) throw updateError;
      setLinkSentTo(trimmed);
      setEmail("");
    } catch (e) {
      setLinkError(
        friendlyAuthError(e instanceof Error ? e.message : null, "send"),
      );
    } finally {
      setLinking(false);
    }
  }

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName || saving) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: trimmed })
        .eq("id", userId);
      if (updateError) throw new Error("Couldn't save that name — try again.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  }

  // Inset form — renders inside the identity card, so no outer card chrome
  // of its own, just a divider and the fields.
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold text-text-primary">
          Edit profile
        </h2>
        <button
          type="button"
          onClick={() => {
            onClose();
            setName(currentName);
            setError(null);
          }}
          className="rounded-[10px] border-[0.5px] border-border bg-white px-3 py-1.5 text-sm font-semibold text-text-primary"
        >
          Done
        </button>
      </div>

      <AvatarUploader userId={userId} currentUrl={currentAvatarUrl} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text-primary">
          Display name
        </span>
        <span className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoComplete="name"
            className="min-w-0 flex-1 rounded-[10px] border-[0.5px] border-border bg-white px-4 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-primary"
          />
          <button
            type="button"
            onClick={() => void saveName()}
            disabled={
              saving || !name.trim() || name.trim() === currentName
            }
            className="shrink-0 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-1.5 border-t border-border pt-3">
        <span className="text-sm font-medium text-text-primary">Email</span>
        {currentEmail ? (
          <p className="text-sm leading-6 text-text-secondary">
            {currentEmail}
          </p>
        ) : linkSentTo ? (
          <p className="text-sm leading-6 text-text-secondary">
            Confirmation sent to {linkSentTo}. Tap the link in that inbox and
            the address links to this account.
          </p>
        ) : (
          <>
            <p className="text-xs leading-5 text-text-secondary">
              No email on this account yet. Link one for a second way in.
            </p>
            <span className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLinkError(null);
                }}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                className="min-w-0 flex-1 rounded-[10px] border-[0.5px] border-border bg-white px-4 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => void linkEmail()}
                disabled={linking || !email.trim().includes("@")}
                className="shrink-0 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {linking ? "Sending…" : "Link"}
              </button>
            </span>
            {linkError && (
              <p role="alert" className="text-sm font-medium text-danger">
                {linkError}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
