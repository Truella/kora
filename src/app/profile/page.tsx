import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon } from "@hugeicons/core-free-icons";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B3D2E]/10 dark:bg-white/10">
        <HugeiconsIcon
          icon={UserIcon}
          size={26}
          className="text-[#0B3D2E] dark:text-[#E8B84B]"
        />
      </span>
      <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
      <p className="max-w-xs text-sm leading-6 text-zinc-500">
        Sign-in with Supabase Auth OTP and your trust score land on Day 2 and
        Day 5. Nothing to set up here yet.
      </p>
    </main>
  );
}
