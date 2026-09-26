import { HugeiconsIcon } from "@hugeicons/react";
import { UserMultipleIcon } from "@hugeicons/core-free-icons";
import type { HomeInvite } from "@/lib/home";
import InviteActions from "./InviteActions";

// Shared invite rows: the Attention queue embeds them between money and
// votes; the zero-circles home embeds them under their own heading. One
// component so the two cannot drift.
export default function InviteList({ invites }: { invites: HomeInvite[] }) {
  return (
    <>
      {invites.map((invite) => (
        <li
          key={`invite:${invite.inviteId}`}
          className="flex flex-col gap-3 rounded-[10px] bg-black/[0.02] px-4 py-3"
        >
          <div className="flex items-start gap-3">
            <HugeiconsIcon
              icon={UserMultipleIcon}
              size={18}
              className="mt-0.5 shrink-0 text-primary"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">
                You&apos;re invited to {invite.groupName}
              </p>
              <p className="truncate text-xs text-text-secondary">
                Invited by {invite.inviterName} · members vote every request in
              </p>
            </div>
          </div>
          <InviteActions inviteId={invite.inviteId} groupId={invite.groupId} />
        </li>
      ))}
    </>
  );
}
