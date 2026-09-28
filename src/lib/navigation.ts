// Shared post-auth redirect guard. Only same-origin absolute paths pass;
// everything else falls back (default /home) so a crafted `next` param can
// never bounce the user off-site. Single home for the five copies that used
// to live in the auth forms and the callback route.
export function safeNext(raw: string | null, fallback = "/home"): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}
