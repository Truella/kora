import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import Reveal, { RevealLi } from "@/components/Reveal";
import type { ProfileTrustCircle } from "@/types/profile";

export function TrustList({ circles }: { circles: ProfileTrustCircle[] }) {
  return (
    <Reveal delay={0.1}>
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-semibold tracking-tight text-text-primary">
            Trust in each circle
          </h2>
          {circles.length > 0 && (
            <p className="shrink-0 font-mono text-[11px] text-text-secondary">
              {circles.length} circle{circles.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <p className="-mt-1 text-xs leading-5 text-text-secondary">
          Every circle keeps its own score.
        </p>
        {circles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[14px] border-[0.5px] border-border bg-surface px-6 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-primary/10">
              <HugeiconsIcon
                icon={UserGroupIcon}
                size={24}
                className="text-primary"
              />
            </span>
            <p className="font-display text-base font-semibold text-text-primary">
              No circles yet
            </p>
            <p className="max-w-xs text-xs leading-5 text-text-secondary">
              Join a circle and your trust record for it will show up here.
            </p>
            <Link
              href="/groups"
              className="mt-1 inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Find your circles
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {circles.map((g, i) => (
              <RevealLi
                key={g.id}
                delay={Math.min(i * 0.05, 0.2)}
                className="rounded-[10px] border-[0.5px] border-border bg-surface transition-colors duration-150 hover:border-primary/25"
              >
                <Link
                  href={`/groups/${g.id}`}
                  className="flex items-center gap-3 p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/10">
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      size={20}
                      className="text-primary"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-text-primary">
                      {g.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-text-secondary">
                      {g.recordDetail}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-[#F3EDDF] px-3 py-1 text-xs font-semibold whitespace-nowrap text-[#7A6028]">
                    Trust {g.trust}
                  </span>
                </Link>
              </RevealLi>
            ))}
          </ul>
        )}
      </section>
    </Reveal>
  );
}
