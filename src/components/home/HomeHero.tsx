"use client";

import { ArrowUpRight } from "lucide-react";
import { site } from "@/content/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

type Props = {
  /** Streamed in after the hero paints — usually the open-drive note. */
  children?: React.ReactNode;
};

export function HomeHero({ children }: Props) {
  return (
    <section className="relative isolate min-h-[min(100svh,56rem)] overflow-hidden border-b border-line field-wash">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-ember/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-10 left-1/3 h-48 w-48 rounded-full blur-3xl"
        style={{ background: "var(--glow-mint)" }}
      />
      <Container className="relative z-10 flex min-h-[min(100svh,56rem)] flex-col justify-end pb-16 pt-28 sm:pb-20">
        <div className="max-w-2xl animate-rise">
          <p className="eyebrow">
            {site.college}
          </p>
          <h1 className="mt-5 font-display text-[clamp(3.5rem,11vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.06em] text-ink">
            {site.name}
          </h1>
          <p className="mt-4 font-serif text-xl leading-snug text-ink-soft sm:text-2xl text-balance">
            {site.line}
          </p>
          <p className="mt-6 max-w-md text-base leading-relaxed text-mute sm:text-lg">
            {site.heroSupport}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button href="/events" variant="primary" size="lg">
              See events
            </Button>
            <Button href="/brochure" variant="ghost" size="lg">
              Brochure
            </Button>
            <Button href="/about" variant="link" className="gap-1">
              Who we are <ArrowUpRight size={16} />
            </Button>
          </div>

          {children}
        </div>
      </Container>
    </section>
  );
}
