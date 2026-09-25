import type { SupabaseClient } from "@supabase/supabase-js";

export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ACCEPT = ["image/jpeg", "image/png", "image/webp"] as const;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Client-side validation shared by profile + onboarding pickers. Returns an error string or null. */
export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_ACCEPT.includes(file.type as (typeof AVATAR_ACCEPT)[number])) {
    return "Use a JPG, PNG, or WebP photo.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "Photo must be under 2MB.";
  }
  return null;
}

/**
 * Uploads `file` to `<uid>/...` in the public `avatars` bucket and returns the
 * public URL. Clears the user's previous files first so ext switches
 * (png → jpg) don't leave orphans. Throws with a friendly message on failure.
 */
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<string> {
  const invalid = validateAvatarFile(file);
  if (invalid) throw new Error(invalid);

  const ext = EXT_BY_TYPE[file.type] ?? "jpg";

  // Best-effort cleanup of previous uploads (different ext / old timestamps).
  try {
    const { data: existing } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(userId);
    const stale = (existing ?? [])
      .filter((o) => o.name && !o.name.startsWith("."))
      .map((o) => `${userId}/${o.name}`);
    if (stale.length > 0) {
      await supabase.storage.from(AVATAR_BUCKET).remove(stale);
    }
  } catch {
    // Non-fatal — the upload below is what matters.
  }

  const path = `${userId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error("Couldn't upload that photo. Try again.");

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Couldn't upload that photo. Try again.");
  return data.publicUrl;
}
