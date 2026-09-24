"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// Slim brand bar for app + auth screens. Mounted by the (app) and (auth)
// route-group layouts, never by the root layout — so the landing page and
// the error pages get neither this bar nor the sidebar.
// Signed-in users get a header Sign out (the Profile page keeps its own
// button as a fallback — header is the discoverable one).
export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUser(data.user));
  }, [pathname]);

  if (user === undefined) return null; // session resolving — no flash

  async function signOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:h-[var(--app-header-h)]">
      <div className="mx-auto flex w-full max-w-md items-center gap-2.5 px-4 py-3 lg:h-full lg:max-w-5xl lg:py-0">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-hero-bg">
          <Image
            src="/brand/kora-mark-white.svg"
            alt="Kora logo"
            width={22}
            height={22}
          />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[17px] font-semibold tracking-tight font-display">Kora</p>
          <p className="text-[11px] text-text-secondary">
            Savings circles, without the custody risk
          </p>
        </div>
        {user && (
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="shrink-0 rounded-[10px] border-[0.5px] border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-primary disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        )}
      </div>
    </header>
  );
}
