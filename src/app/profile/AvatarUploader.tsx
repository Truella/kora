"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/avatar";

export default function AvatarUploader({
  userId,
  currentUrl,
}: {
  userId: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    if (!file || uploading) return;
    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const supabase = createClient();
      const publicUrl = await uploadAvatar(supabase, userId, file);
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);
      if (profileError) throw new Error("Photo uploaded, but couldn't save it — try again.");
      setPreview(`${publicUrl}?t=${Date.now()}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't upload that photo — try again.");
      setPreview(currentUrl);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-ink dark:text-white">
      {preview ? (
        <Image
          src={preview}
          alt="Your profile photo"
          width={56}
          height={56}
          // Local-pick previews are blob: URLs — skip optimization for those.
          unoptimized={preview.startsWith("blob:")}
          className="h-14 w-14 shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo/10 text-lg font-semibold text-indigo dark:bg-white/10 dark:text-gold">
          ?
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Profile photo</p>
        <p className="text-xs leading-5 text-zinc-500">
          {uploading ? "Uploading…" : "JPG, PNG, or WebP under 2MB. Circle members will see it."}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-xs font-medium text-clay">
            {error}
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label="Choose a profile photo"
        onChange={(e) => void onPick(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="shrink-0 rounded-full bg-indigo px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {preview ? "Change" : "Upload"}
      </button>
    </div>
  );
}
