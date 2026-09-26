"use client";

import { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  ShieldCheckIcon,
  Mail01Icon,
  Call02Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";
import ProfileEditorForm from "./ProfileEditor";

// Identity card for the profile tab. Display is the default — avatar, name,
// contacts and the payment record are always visible. Editing lives behind
// the header action so the tab reads as a profile first and a form only on
// demand. No footer action bar: the card ends on the stat strip (or the
// form while editing).
export default function ProfileHero({
  displayName,
  phone,
  verified,
  email,
  avatarUrl,
  fallbackInitials,
  userId,
  currentName,
  currentAvatarUrl,
  currentEmail,
  circleCount,
  totalOnTime,
  totalLate,
}: {
  displayName: string;
  phone: string | null;
  verified: boolean;
  email: string | null;
  avatarUrl: string | null;
  fallbackInitials: string | null;
  userId: string;
  currentName: string;
  currentAvatarUrl: string | null;
  currentEmail: string | null;
  circleCount: number;
  totalOnTime: number;
  totalLate: number;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <section className="rounded-[20px] border-[0.5px] border-border bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-4">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Your profile photo"
            width={80}
            height={80}
            className="h-20 w-20 shrink-0 rounded-[18px] object-cover"
          />
        ) : fallbackInitials ? (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[18px] bg-primary/10 font-display text-2xl font-semibold text-primary">
            {fallbackInitials}
          </span>
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[18px] bg-primary/10">
            <HugeiconsIcon icon={UserIcon} size={32} className="text-primary" />
          </span>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-mono text-[11px] tracking-wide text-text-secondary uppercase">
            Member profile
          </p>
          <h1 className="mt-0.5 font-display text-xl leading-tight font-semibold tracking-tight text-text-primary sm:text-2xl">
            {displayName}
          </h1>
          <div className="mt-1.5 flex flex-col gap-1">
            {phone ? (
              <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-text-secondary">
                <HugeiconsIcon
                  icon={Call02Icon}
                  size={14}
                  className="shrink-0"
                />
                <span className="font-mono text-xs">{phone}</span>
                {verified && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E0ECE9] px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <HugeiconsIcon icon={ShieldCheckIcon} size={12} />
                    Verified
                  </span>
                )}
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-[13px] text-text-secondary">
                <HugeiconsIcon
                  icon={Call02Icon}
                  size={14}
                  className="shrink-0"
                />
                No number linked yet
              </p>
            )}
            {email ? (
              <p className="flex min-w-0 items-center gap-1.5 text-[13px] text-text-secondary">
                <HugeiconsIcon icon={Mail01Icon} size={14} className="shrink-0" />
                <span className="truncate">{email}</span>
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-[13px] text-text-secondary">
                <HugeiconsIcon icon={Mail01Icon} size={14} className="shrink-0" />
                No email linked yet
              </p>
            )}
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit profile"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border-[0.5px] border-border bg-white p-2.5 text-[13px] font-semibold text-text-primary transition-colors hover:bg-black/[0.02] sm:px-3.5 sm:py-2"
          >
            <HugeiconsIcon icon={Edit02Icon} size={15} />
            <span className="hidden sm:inline">Edit profile</span>
          </button>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-3 divide-x divide-border rounded-[14px] bg-bg text-center">
        <div className="px-2 py-3">
          <dd className="font-display text-lg font-semibold tabular-nums text-text-primary">
            {circleCount}
          </dd>
          <dt className="mt-0.5 text-[11px] font-medium text-text-secondary">
            Circle{circleCount === 1 ? "" : "s"}
          </dt>
        </div>
        <div className="px-2 py-3">
          <dd className="font-display text-lg font-semibold tabular-nums text-text-primary">
            {totalOnTime}
          </dd>
          <dt className="mt-0.5 text-[11px] font-medium text-text-secondary">
            Paid on time
          </dt>
        </div>
        <div className="px-2 py-3">
          <dd
            className={`font-display text-lg font-semibold tabular-nums ${totalLate > 0 ? "text-danger" : "text-text-primary"}`}
          >
            {totalLate}
          </dd>
          <dt className="mt-0.5 text-[11px] font-medium text-text-secondary">
            Paid late
          </dt>
        </div>
      </dl>

      {editing && (
        <ProfileEditorForm
          userId={userId}
          currentName={currentName}
          currentAvatarUrl={currentAvatarUrl}
          currentEmail={currentEmail}
          onClose={() => setEditing(false)}
        />
      )}
    </section>
  );
}
