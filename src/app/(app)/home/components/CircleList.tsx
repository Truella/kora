import type { HomeSnapshot } from "@/lib/home";
import SectionHead from "./SectionHead";
import CircleCard from "./CircleCard";

// Circles are the product, so they get the page's largest repeated surface.
// The list is capped and ranked by the data layer: anything with money due
// (soonest first), then circles waiting on a schedule, then the rest.
export default function CircleList({ snapshot }: { snapshot: HomeSnapshot }) {
  const { circles, circlesTotal } = snapshot;
  if (circles.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHead title="Your circles" href="/groups" />

      <ul className="grid gap-4 md:grid-cols-2">
        {circles.map((circle) => (
          <li key={circle.groupId}>
            <CircleCard circle={circle} />
          </li>
        ))}
      </ul>

      {circlesTotal > circles.length && (
        <p className="text-xs text-text-secondary">
          +{circlesTotal - circles.length} more circle
          {circlesTotal - circles.length === 1 ? "" : "s"} in your full list
        </p>
      )}
    </section>
  );
}
