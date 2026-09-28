import type { RefObject } from "react";
import Image from "next/image";

export function NameStep({
  name,
  onNameChange,
  avatarPreview,
  avatarError,
  onPickAvatar,
  onRemoveAvatar,
  avatarInputRef,
}: {
  name: string;
  onNameChange: (value: string) => void;
  avatarPreview: string | null;
  avatarError: string | null;
  onPickAvatar: (file: File | undefined) => void;
  onRemoveAvatar: () => void;
  avatarInputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Full name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Adaeze Okafor"
          autoComplete="name"
          autoFocus
          className="rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-3 text-[16px] text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-primary"
        />
      </label>
      <p className="text-xs leading-5 text-text-secondary">
        Shows on invites, votes, and the ledger.
      </p>
      <div className="flex items-center gap-3">
        {avatarPreview ? (
          <Image
            src={avatarPreview}
            alt="Your profile photo preview"
            width={48}
            height={48}
            unoptimized
            className="h-12 w-12 shrink-0 rounded-[10px] object-cover"
          />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 font-display text-sm font-semibold text-primary">
            {name.trim().charAt(0).toUpperCase() || "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            Profile photo{" "}
            <span className="font-normal text-text-secondary">(optional)</span>
          </p>
          <p className="text-xs text-text-secondary">
            JPG, PNG, or WebP under 2MB.
          </p>
          {avatarError && (
            <p role="alert" className="mt-0.5 text-xs font-medium text-danger">
              {avatarError}
            </p>
          )}
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          aria-label="Choose a profile photo"
          onChange={(e) => onPickAvatar(e.target.files?.[0])}
        />
        {avatarPreview ? (
          <button
            type="button"
            onClick={onRemoveAvatar}
            className="shrink-0 rounded-[10px] border-[0.5px] border-border bg-white px-4 py-2 text-xs font-semibold text-text-primary"
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="shrink-0 rounded-[10px] border-[0.5px] border-border bg-white px-4 py-2 text-xs font-semibold text-text-primary"
          >
            Add
          </button>
        )}
      </div>
    </>
  );
}
