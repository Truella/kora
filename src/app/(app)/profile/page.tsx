import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/Reveal";
import { loadProfile } from "@/lib/profile";
import ProfileHero from "./ProfileHero";
import SignOutButton from "./SignOutButton";
import { AccountCard } from "./AccountCard";
import { TrustList } from "./TrustList";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? await loadProfile(supabase, user.id, user.email ?? null)
    : null;

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      {/* Identity hero — photo and name up top, payment record as a stat
          strip so the card earns its width. Edit sits in the header, so
          the card ends cleanly on the stats (or the form while editing). */}
      <Reveal>
        {profile ? (
          <ProfileHero
            displayName={profile.displayName}
            phone={profile.phone}
            verified={profile.verified}
            email={profile.email}
            avatarUrl={profile.avatarUrl}
            fallbackInitials={profile.fallbackInitials}
            userId={profile.userId}
            currentName={profile.currentName}
            currentAvatarUrl={profile.avatarUrl}
            currentEmail={profile.email}
            circleCount={profile.circleCount}
            totalOnTime={profile.totalOnTime}
            totalLate={profile.totalLate}
          />
        ) : (
          <section className="rounded-[20px] border-[0.5px] border-border bg-surface p-5 sm:p-6">
            <h1 className="font-display text-xl font-semibold tracking-tight text-text-primary">
              Your profile
            </h1>
          </section>
        )}
      </Reveal>

      <AccountCard
        verified={profile?.verified ?? false}
        email={profile?.email ?? null}
      />

      <TrustList circles={profile?.trustCircles ?? []} />

      <div className="pb-2">
        <SignOutButton />
      </div>
    </main>
  );
}
