import Reveal from "@/components/Reveal";

export default function NamesStrip() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-14 text-center">
      <Reveal>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
          However you call it, the idea is the same.
        </h2>
        <p className="mt-3 font-display text-2xl font-semibold text-text-primary">
          Ajo. Esusu. Adashi. Susu. Chama.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-text-secondary">
          People contribute together, take turns, and help each other reach
          bigger financial goals. We&apos;re giving that familiar system a
          shared digital record and a simpler way to manage the circle.
        </p>
      </Reveal>
    </section>
  );
}
