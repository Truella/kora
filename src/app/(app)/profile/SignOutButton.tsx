"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout02Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      disabled={signingOut}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border-[0.5px] border-border bg-surface py-[13px] text-sm font-semibold text-text-primary transition-colors hover:bg-black/[0.02] disabled:opacity-60"
    >
      <HugeiconsIcon icon={Logout02Icon} size={17} />
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
