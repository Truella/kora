const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/**
 * Resolve the three shapes that survive copy/paste into one safe local route:
 * a full invite URL, a relative /groups/<id>[/join] path, or a bare group id.
 * Only a valid inviter profile UUID is carried through as `by`; every other
 * query parameter is discarded so pasted text can never choose our destination.
 */
export function resolveInviteLink(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value, "https://kora.local");
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const groupPath = new RegExp(`^/groups/(${UUID})(?:/join)?/?$`, "i");
  const barePath = new RegExp(`^/(${UUID})/?$`, "i");
  const match =
    groupPath.exec(url.pathname) ?? barePath.exec(url.pathname) ?? null;
  if (!match) return null;

  const groupId = match[1].toLowerCase();
  const by = url.searchParams.get("by");
  const attribution =
    by && new RegExp(`^${UUID}$`, "i").test(by)
      ? `?by=${by.toLowerCase()}`
      : "";
  return `/groups/${groupId}/join${attribution}`;
}
