import type { ComponentProps, ReactNode } from "react";

// The circle-detail quick-action grid (Ledger / Members / Invite / Activity).
// Extracted because the same class string was pasted into four places across
// two files, and had already drifted from the hover states used elsewhere in
// the app — the paste said `hover:bg-black/[0.02]`, a 2% black wash on a flat
// white card, which is close to invisible.
//
// The treatment is tint + border, no movement and no shadow:
//   - the wash is a neutral, not a status hue. A petrol or success wash here
//     would read as a state (the `E0ECE9` / `success` lane is "paid"), and a
//     transient hover must never look like a persistent badge.
//   - it is `0.05`, double the strongest wash already in the app (the home
//     attention row uses `0.045`), because at tile size anything lighter
//     disappears against `surface` white.
//   - the border warms to `primary/25`, matching the circles directory card.
//     `primary-hover` is deliberately not used: DESIGN_TOKENS scopes it to
//     primary button fills only.
// `focus-visible` is not optional. These were keyboard-invisible before — a
// hover affordance with no focus state is an affordance for half the users.
export const ACTION_TILE =
  "flex w-full flex-col items-center gap-1.5 rounded-[14px] border-[0.5px] border-border bg-surface p-3 text-center transition-colors duration-150 ease-out hover:border-primary/25 hover:bg-black/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:bg-black/[0.07]";

export function ActionTile({
  href,
  icon,
  label,
  ...rest
}: {
  href: string;
  icon: ReactNode;
  label: string;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">) {
  return (
    <a href={href} className={ACTION_TILE} {...rest}>
      <span className="text-primary">{icon}</span>
      <span className="text-xs font-semibold text-text-primary">{label}</span>
    </a>
  );
}
