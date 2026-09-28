"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveInviteLink } from "@/lib/invite-link";
import { cn } from "@/lib/utils";

export function JoinLinkForm({
  autoFocus = false,
  className,
  id,
}: {
  autoFocus?: boolean;
  className?: string;
  id: string;
}) {
  const router = useRouter();
  const [invite, setInvite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const href = resolveInviteLink(invite);

    if (!href) {
      setError("That doesn't look like an invite link. Paste the full link.");
      return;
    }

    router.push(href);
  }

  return (
    <form
      onSubmit={handleJoin}
      className={cn("flex flex-col gap-3", className)}
    >
      <Label htmlFor={id} className="sr-only">
        Invite link
      </Label>
      <div className="relative">
        <Link2
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
          size={16}
        />
        <Input
          id={id}
          value={invite}
          onChange={(event) => {
            setInvite(event.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste invite link"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="url"
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${descriptionId} ${errorId}` : descriptionId
          }
          autoFocus={autoFocus}
          className="h-12 bg-bg pl-10 text-[16px] focus-visible:ring-primary/10"
        />
      </div>

      <p id={descriptionId} className="sr-only">
        Paste the invite link someone sent you.
      </p>
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <Button type="submit" className="mt-1 w-full rounded-[12px] py-3">
        Open invite
      </Button>
    </form>
  );
}
