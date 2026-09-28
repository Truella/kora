import Image from "next/image";
import Link from "next/link";

export default function SiteFooter({ createHref }: { createHref: string }) {
  return (
    <footer className="bg-hero-bg text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-12">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Image
              src="/brand/kora-logo-white.svg"
              alt="Kora"
              width={105}
              height={60}
              className="h-10 w-auto"
            />
            <p className="mt-4 text-sm leading-6 text-white/70">
              Invite-only savings circles for people who know and trust
              each other.
            </p>
          </div>
          <div className="flex gap-16">
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
                Product
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {[
                  ["Why Kora", "#why-kora"],
                  ["How it works", "#how-it-works"],
                  ["FAQ", "#faq"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-white/70 hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
                Account
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                <li>
                  <Link href="/login" className="text-white/70 hover:text-white">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href={createHref}
                    className="text-white/70 hover:text-white"
                  >
                    Create a circle
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 font-mono text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kora</p>
          <p>Invite-only savings circles · Nigeria · Kenya · Uganda · Ghana</p>
        </div>
      </div>
    </footer>
  );
}
