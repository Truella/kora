import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, ShieldCheckIcon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./signout-button";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, phone, phone_verified")
        .eq("id", user.id)
        .single()
    : { data: null };

  const verified = profile?.phone_verified ?? false;

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo/10 dark:bg-white/10">
          <HugeiconsIcon
            icon={UserIcon}
            size={26}
            className="text-indigo dark:text-gold"
          />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {profile?.full_name || "Your profile"}
          </h1>
          <p className="font-mono text-xs text-zinc-500">
            {profile?.phone ?? user?.email ?? ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-ink">
        <HugeiconsIcon
          icon={ShieldCheckIcon}
          size={22}
          className={verified ? "text-jade" : "text-clay"}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {verified ? "Number verified" : "Number not verified"}
          </p>
          <p className="text-xs leading-5 text-zinc-500">
            {verified
              ? "USSD can identify you by this number."
              : "Verify a number to unlock anything USSD-related."}
          </p>
        </div>
        {!verified && (
          <Link
            href="/add-phone?next=/profile"
            className="shrink-0 rounded-full bg-indigo px-4 py-2 text-xs font-semibold text-white"
          >
            Verify
          </Link>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <SignOutButton />
      </div>
    </main>
  );
}
