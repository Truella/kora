import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public without a session. / is the public landing page only — the
// signed-in app home lives on /home (protected, redirects to /login
// with ?next= when signed out).
// /auth/callback receives the magic-link ?code= before any session exists.
// /api/ussd is the Africa's Talking webhook —
// callers have no Supabase session (phone-number identity, read-only), so
// it authenticates itself and stays public. /add-phone and /onboarding
// need a session (updateUser / profile writes), so they stay protected.
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/verify",
  "/offline",
  "/auth/callback",
  "/api/ussd",
];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!user && !isPublic) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (user && (pathname === "/login" || pathname === "/verify")) {
    // Already signed in — verify/add-phone handle their own redirects.
    // /verify is reachable signed-in for the add-phone flow.
    if (pathname === "/login") {
      const home = request.nextUrl.clone();
      home.pathname = "/home";
      home.search = "";
      return NextResponse.redirect(home);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets and Next internals; everything else goes through auth.
    //
    // api/home is excluded because it does its own session check and returns
    // 401 JSON — the redirect below would hand an XHR a 307 to /login and the
    // client would get HTML where it expects JSON. /api/ussd is public for a
    // different reason (no Supabase session at all; Africa's Talking
    // identifies callers by phone).
    "/((?!_next/static|_next/image|favicon.ico|icons|brand|manifest.webmanifest|sw.js|api/home).*)",
  ],
};
