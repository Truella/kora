import Reveal from "@/components/Reveal";

export default function TrustSection() {
  return (
    <section
      id="trust"
      className="bg-[radial-gradient(circle_at_88%_8%,rgba(191,154,78,0.26),transparent_34%),linear-gradient(135deg,#0B2624_0%,#14524F_125%)]"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-14">
        <Reveal>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
            Invite-only · member-voted
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">
            The circle stays yours.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
            You already know who you trust enough to save with. Keep it that
            way. Create an invite-only circle, bring in the people you know,
            and let existing members vote on every new request. Then keep the
            money moving and the record open to everyone in the group.
          </p>
          <ul className="mt-6 flex flex-col gap-2">
            {[
              "Invite-only. No public pools, no strangers",
              "Every join request goes to a member vote",
              "The organizer sets the schedule, never holds money",
            ].map((t) => (
              <li
                key={t}
                className="flex items-center gap-3 text-sm text-white"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 font-mono text-xs font-bold text-[#E8CF8E]">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
