// Friendly copy for Supabase Auth failures. Raw provider messages
// ("Token has expired or is invalid", "Error sending SMS", …) mean
// nothing to members, so every auth screen maps through here.
// Pure — safe to import from client components and route handlers.

export type AuthErrorKind = "send" | "code" | "link";

export function friendlyAuthError(
  raw: string | null | undefined,
  kind: AuthErrorKind,
): string {
  const msg = (raw ?? "").toLowerCase();

  if (
    msg.includes("too many") ||
    msg.includes("rate limit") ||
    msg.includes("rate_limit") ||
    (msg.includes("after") && msg.includes("second"))
  ) {
    return "Too many attempts — wait a minute, then try again.";
  }

  if (msg.includes("expired")) {
    if (kind === "code") {
      return "That code expired — tap Resend code below for a fresh one.";
    }
    return "That link expired — head back and request a fresh one.";
  }

  if (
    msg.includes("invalid") ||
    msg.includes("incorrect") ||
    msg.includes("mismatch") ||
    msg.includes("not found") ||
    (msg.includes("token") && kind === "code")
  ) {
    if (kind === "code") {
      return "That code didn't match — check the digits and try again.";
    }
    return "That link didn't work — request a fresh one and try again.";
  }

  if (msg.includes("failed to fetch") || msg.includes("network")) {
    return "Could not reach the sign-in service. Check your connection and try again.";
  }

  if (
    msg.includes("sms") ||
    msg.includes("phone") ||
    msg.includes("provider") ||
    msg.includes("sending") ||
    msg.includes("twilio") ||
    msg.includes("vonage")
  ) {
    return "We couldn't send the text right now — the line may be down. Try again shortly, or use email instead.";
  }

  if (msg.includes("signup") || msg.includes("sign up")) {
    return "New sign-ups are paused at the moment — try again later.";
  }

  if (kind === "send") {
    return "We couldn't send the code. Check the details and try again.";
  }
  if (kind === "link") {
    return "That sign-in link failed. Head back and request a fresh one.";
  }
  return "That code didn't work — check it and try again.";
}
