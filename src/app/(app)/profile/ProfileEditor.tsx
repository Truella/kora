"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AvatarUploader from "./AvatarUploader";

// Display/edit split for the profile tab. Display is the default —
// identity, verification, and trust are always visible. Photo + name
// editing lives behind the toggle so the tab reads as a profile first
// and a form only on demand.
export default function ProfileEditor({
  userId,
  currentName,
  currentAvatarUrl,
}: {
  userId: string;
  currentName: string;
  currentAvatarUrl: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A fresh server snapshot (router.refresh() after a photo upload)
  // must win over the draft seeded at mount.
  const [synced, setSynced] = useState({
    name: currentName,
    url: currentAvatarUrl,
  });
  if (currentName !== synced.name || currentAvatarUrl !== synced.url) {
    setSynced({ name: currentName, url: currentAvatarUrl });
    setName(currentName);
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

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-black/[0.02]"
      >
        Edit profile
      </button>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-[14px] border-[0.5px] border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold text-text-primary">
          Edit profile
        </h2>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
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
      <p className="text-xs leading-5 text-text-secondary">
        Shows on invites, votes, and the ledger.
      </p>
    </section>
  );
}
