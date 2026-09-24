"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// Slim brand bar for app + auth screens. Hidden on the guest landing page,
// which ships its own external nav — otherwise visitors get double branding.
export default function AppHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUser(data.user));
  }, [pathname]);

  if (user === undefined) return null;
  if (!user && pathname === "/") return null;
  // TEMP design-system preview ships its own chrome — DELETE before submission.
  if (pathname === "/design" || pathname.startsWith("/design/")) return null;

  return (
    <header className="sticky top-0 z-10 border-b border-indigo/5 bg-paper/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-center gap-2.5 px-4 py-3 lg:max-w-5xl">
        <Image
          src="/icons/icon.svg"
          alt="Kora logo"
          width={32}
          height={32}
          className="rounded-lg"
        />
        <div className="leading-tight">
          <p className="text-[17px] font-semibold tracking-tight">Kora</p>
          <p className="text-[11px] text-indigo/60">
            Savings circles, without the custody risk
          </p>
        </div>
      </div>
    </header>
  );
}
