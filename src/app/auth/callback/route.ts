import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

/**
 * Handles Supabase email magic-link sign-ins (?code=).
 * Routes by profile state: no name → onboarding, no verified phone →
 * add-phone prompt, otherwise the original destination.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone_verified")
    .eq("id", user.id)
    .single();

  const dest = !profile?.full_name
    ? `/onboarding?next=${encodeURIComponent(next)}`
    : !profile.phone_verified
      ? `/add-phone?next=${encodeURIComponent(next)}`
      : next;
  return NextResponse.redirect(new URL(dest, url.origin));
}
