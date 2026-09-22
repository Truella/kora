import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";
import PayButton from "./PayButton";
import ConfirmingBanner from "./ConfirmingBanner";

export const metadata = { title: "Circle" };

const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  GHS: "GH₵",
  KES: "KSh",
  UGX: "USh",
};

const BADGE: Record<string, string> = {
  pending: "bg-gold/15 text-ink dark:text-white",
  paid: "bg-jade/15 text-jade",
  late: "bg-clay/15 text-clay",
};

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid } = await searchParams;
  const confirming = paid === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS ("view groups you belong to") returns a row only for members —
  // a missing row means not-found or not-a-member, same UI either way.
  const { data: group } = await supabase
    .from("groups")
    .select(
      "id, name, description, contribution_amount, currency, frequency, status",
    )
    .eq("id", id)
    .maybeSingle();

  if (!group) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-white">
          Circle not found
        </h1>
        <p className="max-w-xs text-sm leading-6 text-zinc-500">
          It may not exist, or you are not a member of it.
        </p>
        <Link
          href="/groups"
          className="mt-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink"
        >
          Back to circles
        </Link>
      </main>
    );
  }

  const symbol = SYMBOLS[group.currency] ?? group.currency;
  const amountLabel = `${symbol}${Number(group.contribution_amount).toLocaleString()}`;

  const { data: member } = user
    ? await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };

  const { data: cycles } = await supabase
    .from("cycles")
    .select("id, cycle_number, due_date, status")
    .eq("group_id", id)
    .order("cycle_number", { ascending: true });

  const { data: contributions } = member
    ? await supabase
        .from("contributions")
        .select("id, cycle_id, status, paid_at")
        .eq("member_id", member.id)
    : { data: [] };

  const byCycle = new Map(
    (contributions ?? []).map((c) => [c.cycle_id, c]),
  );

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      {confirming && <ConfirmingBanner />}

      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo/10 dark:bg-white/10">
          <HugeiconsIcon
            icon={UserGroupIcon}
            size={20}
            className="text-indigo dark:text-gold"
          />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-white">
            {group.name}
          </h1>
          <p className="font-mono text-xs text-zinc-500">
            {amountLabel} {group.currency} · {group.frequency} · {group.status}
          </p>
        </div>
      </div>

      {!cycles || cycles.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white p-5 text-center dark:border-white/10 dark:bg-ink">
          <p className="font-display text-lg font-semibold text-ink dark:text-white">
            Waiting for schedule
          </p>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            The payout rotation has not been generated yet — check back once
            the circle activates.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {cycles.map((cycle) => {
            const contribution = byCycle.get(cycle.id);
            const status = contribution?.status ?? "pending";
            const isPaid = status === "paid";
            return (
              <li
                key={cycle.id}
                className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-ink"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-ink dark:text-white">
                      Cycle {cycle.cycle_number}
                    </p>
                    <p className="font-mono text-xs text-zinc-500">
                      {amountLabel} · due {cycle.due_date} · {cycle.status}
                      {contribution?.paid_at
                        ? ` · paid ${new Date(contribution.paid_at).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${BADGE[status] ?? BADGE.pending}`}
                  >
                    {status}
                  </span>
                </div>
                {member && !isPaid && (
                  <PayButton
                    cycleId={cycle.id}
                    groupId={group.id}
                    amountLabel={amountLabel}
                  />
                )}
                {isPaid && (
                  <p className="text-xs text-zinc-400">
                    Paid — receipt confirmed by webhook.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
