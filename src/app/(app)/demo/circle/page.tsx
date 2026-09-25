import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  TurnHero,
  EventCard,
  MembersPanel,
  TurnRow,
  DueChip,
  SettledChip,
  type MemberRow,
} from "../../groups/[id]/TurnViews";

export const dynamic = "force-static";

export const metadata = { title: "Circle states catalog" };

// Every state of the circle workspace, rendered through the same components
// as the real detail page — mock data, inert actions. If a state looks
// wrong here, it looks wrong in the product.

// Inert lookalikes of the live client buttons (same classes, no handlers).
function MockPay({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-[13px] text-sm font-semibold text-white"
    >
      {label}
      <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
    </span>
  );
}

function MockCompactPay({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center gap-1.5 self-start rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
    >
      {label}
    </span>
  );
}

function MockConfirm() {
  return (
    <span
      aria-hidden
      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
    >
      Confirm money collected
      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
    </span>
  );
}

function Scenario({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-text-secondary">
        {index} · {title}
      </p>
      {children}
    </section>
  );
}

const PAID = (
  <p className="text-xs font-medium text-white/90">✓ Paid 23 Sep</p>
);
const PENDING = (
  <p className="text-xs leading-5 text-white/70">
    Pending · due Tue, 30 Sep. Pay from the card above.
  </p>
);
const LATE = (
  <p className="text-xs font-medium text-[#F2B8B5]">
    Paid late. It arrived after the due date, so your trust score dropped.
  </p>
);

const memberRows: MemberRow[] = [
  {
    id: "m1",
    initial: "O",
    wash: "bg-[#E0ECE9] text-[#1E5A4E]",
    name: "Olayemi Mistura Suleiman",
    you: true,
    role: "Founder",
    turnPos: "Turn 1",
    state: "Share paid",
    trust: "Trust 100",
  },
  {
    id: "m2",
    initial: "O",
    wash: "bg-[#F8EDD9] text-[#8A5F14]",
    name: "Olagunju Alameen",
    next: true,
    role: "Joined via link",
    turnPos: "Turn 2",
    state: "Share pending",
    trust: "Trust · New",
  },
  {
    id: "m3",
    initial: "A",
    wash: "bg-[#F3E1E0] text-[#8A2A21]",
    name: "Adaeze Okonkwo",
    role: "Invited by Olayemi",
    turnPos: "Turn 3",
    state: "Share late",
    trust: "Trust 67",
  },
];

export default function CircleDemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-8 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
          Circle states catalog
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Every state of the circle workspace through the real components.
          Mock data, buttons inert.
        </p>
      </div>

      <Scenario index="01" title="Share due · pay event + pending hero">
        <EventCard
          tone="gold"
          eyebrow="Your turn to pay"
          title="Your ₦5,700 share · Turn 1"
          sub="Due Tue, 30 Sep. Pay now, late payments lower your trust score."
          action={<MockPay label="Pay your ₦5,700 share" />}
        />
        <TurnHero
          anchorId="demo-due"
          turnNumber={1}
          chip={<DueChip label="Due Tue, 30 Sep" />}
          positionLine="Your turn: 1 of 2"
          contributionAmount="₦5,700"
          contributionState={PENDING}
          receiverLabel="Your turn"
          receiverAmount="₦5,700"
          receiverHighlight
          receiverSub="You receive · Tue, 30 Sep"
          settled={0}
          expected={2}
        />
      </Scenario>

      <Scenario index="02" title="Paid · waiting on others, no event">
        <TurnHero
          anchorId="demo-waiting"
          turnNumber={1}
          chip={<DueChip label="Due Tue, 30 Sep" />}
          positionLine="Your turn: 1 of 2"
          contributionAmount="₦5,700"
          contributionState={PAID}
          receiverLabel="Your turn"
          receiverAmount="₦5,700"
          receiverHighlight
          receiverSub="You receive · Tue, 30 Sep"
          settled={1}
          expected={2}
        />
      </Scenario>

      <Scenario index="03" title="Payout ready · confirm event + full bar">
        <EventCard
          tone="teal"
          eyebrow="Everyone has paid"
          title="Turn 1: ₦11,400 is ready for you."
          sub="Everyone has paid. Confirm that you collected the money to complete this turn."
          action={
            <div className="flex justify-end">
              <MockConfirm />
            </div>
          }
        />
        <TurnHero
          anchorId="demo-ready"
          turnNumber={1}
          chip={<DueChip label="Due Tue, 30 Sep" />}
          positionLine="Your turn: 1 of 2"
          contributionAmount="₦5,700"
          contributionState={PAID}
          receiverLabel="Your turn"
          receiverAmount="₦11,400"
          receiverHighlight
          receiverSub="You receive · Tue, 30 Sep"
          settled={2}
          expected={2}
        />
      </Scenario>

      <Scenario index="04" title="Received · settled hero">
        <TurnHero
          anchorId="demo-received"
          turnNumber={1}
          chip={<SettledChip label="✓ Settled" />}
          positionLine="Your turn: 1 of 2"
          contributionAmount="₦5,700"
          contributionState={PAID}
          receiverLabel="Your turn"
          receiverAmount="₦11,400"
          receiverHighlight
          receiverSub="✓ Received 30 Sep"
          settled={2}
          expected={2}
        />
      </Scenario>

      <Scenario index="05" title="Late share">
        <TurnHero
          anchorId="demo-late"
          turnNumber={2}
          chip={<DueChip label="Due Tue, 7 Oct" />}
          positionLine="Your turn: 2 of 3"
          contributionAmount="₦5,700"
          contributionState={LATE}
          receiverLabel="Receiver"
          receiverAmount="₦17,100"
          receiverHighlight={false}
          receiverSub="Adaeze Okonkwo receives · Tue, 7 Oct"
          settled={2}
          expected={3}
        />
      </Scenario>

      <Scenario index="06" title="Someone else's turn">
        <TurnHero
          anchorId="demo-other"
          turnNumber={2}
          chip={<DueChip label="Due Tue, 7 Oct" />}
          positionLine="Your turn: 1 of 2"
          contributionAmount="₦5,700"
          contributionState={PAID}
          receiverLabel="Receiver"
          receiverAmount="₦11,400"
          receiverHighlight={false}
          receiverSub="Olagunju Alameen receives · Tue, 7 Oct"
          settled={1}
          expected={2}
        />
      </Scenario>

      <Scenario index="07" title="Failed payout">
        <TurnHero
          anchorId="demo-failed"
          turnNumber={1}
          chip={<DueChip label="Due Tue, 30 Sep" />}
          positionLine="Your turn: 1 of 2"
          contributionAmount="₦5,700"
          contributionState={PAID}
          receiverLabel="Your turn"
          receiverAmount="₦11,400"
          receiverHighlight
          receiverSub="Payout failed. Contact the organizer"
          settled={2}
          expected={2}
        />
      </Scenario>

      <Scenario index="08" title="Upcoming + previous rows">
        <ul className="flex flex-col gap-2">
          <TurnRow
            anchorId="demo-upcoming"
            turnNumber={2}
            meta="2 people will pay ₦5,700 each. Olagunju Alameen will receive ₦11,400 on Tue, 7 Oct."
            done={false}
            shareLine="Your share · Pending · Payout pending"
            action={<MockCompactPay label="Pay ₦5,700" />}
          />
          <TurnRow
            anchorId="demo-past"
            turnNumber={1}
            meta="1 person paid ₦5,700. You received ₦5,700 on Tue, 23 Sep."
            done
            shareLine="Your share ✓ · Payout ✓"
          />
        </ul>
      </Scenario>

      <Scenario index="09" title="Members · paid, pending, late, new">
        <MembersPanel
          count={3}
          note="New members join by member vote"
          rows={memberRows}
        />
      </Scenario>

      <Scenario index="10" title="Waiting for schedule">
        <div className="rounded-[14px] border-[0.5px] border-border bg-surface p-5 text-center">
          <p className="font-display text-lg font-semibold text-text-primary">
            Waiting for schedule
          </p>
          <p className="mt-1 text-sm leading-6 text-text-secondary">
            The payout rotation has not been generated yet. The organizer
            starts it once membership settles.
          </p>
        </div>
        <MembersPanel
          count={2}
          note="New members join by member vote"
          rows={memberRows.slice(0, 2).map((r) => ({ ...r, state: null }))}
        />
      </Scenario>
    </main>
  );
}
