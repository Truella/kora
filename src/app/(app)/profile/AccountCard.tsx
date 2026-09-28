import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShieldCheckIcon, Mail01Icon } from "@hugeicons/core-free-icons";
import Reveal from "@/components/Reveal";

// Account — verification and sign-in paths, grouped as rows in one
// card instead of scattered banners.
export function AccountCard({
  verified,
  email,
}: {
  verified: boolean;
  email: string | null;
}) {
  return (
    <Reveal delay={0.05}>
      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-semibold tracking-tight text-text-primary">
          Account
        </h2>
        <div className="divide-y divide-border overflow-hidden rounded-[14px] border-[0.5px] border-border bg-surface">
          <div className="flex items-center gap-3 p-4">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
                verified
                  ? "bg-[#E0ECE9] text-primary"
                  : "bg-black/[0.04] text-text-secondary"
              }`}
            >
              <HugeiconsIcon icon={ShieldCheckIcon} size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">
                {verified ? "Number verified" : "Number not verified"}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-text-secondary">
                {verified
                  ? "USSD can identify you by this number."
                  : "Verify a number to unlock anything USSD-related."}
              </p>
            </div>
            {verified ? (
              <span className="shrink-0 rounded-full bg-[#E0ECE9] px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                Active
              </span>
            ) : (
              <Link
                href="/add-phone?next=/profile"
                className="shrink-0 rounded-[10px] bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
              >
                Verify
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-black/[0.04] text-text-secondary">
              <HugeiconsIcon icon={Mail01Icon} size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">
                Email sign-in
              </p>
              <p className="mt-0.5 truncate font-mono text-xs text-text-secondary">
                {email ?? "None linked — add one via Edit profile."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
