import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChartMark, SignalBars } from "@/components/brochure/BrochureArt";
import { BrochureHero } from "@/components/brochure/BrochureHero";
import { PerformerMarquee } from "@/components/brochure/PerformerMarquee";
import { brochure } from "@/content/brochure";
import { site } from "@/content/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { DeskLabel } from "@/components/ui/DeskLabel";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sponsorship brochure",
  description: brochure.summary,
};

const impact = [
  { value: "650+", label: "Acre campus" },
  { value: "5", label: "Sponsor tiers" },
  { value: "3", label: "Flagship data contests" },
  { value: "2", label: "Industry podcast" },
] as const;

export default function BrochurePage() {
  return (
    <>
      <BrochureHero />

      <section className="border-b border-line bg-paper-elevated/70 py-10 sm:py-12">
        <Container>
          <ul className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
            {impact.map((item, i) => (
              <li key={item.label}>
                <Reveal delay={0.05 * i} y={10}>
                  <p className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                    {item.value}
                  </p>
                  <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-mute">
                    {item.label}
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="relative overflow-hidden border-b border-line py-20 sm:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <Reveal>
            <DeskLabel index="01">Campus</DeskLabel>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-balance">
              A national institute. A serious stage for your brand.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-mute">
              {brochure.manit.body}
            </p>
            <ul className="mt-8 space-y-3">
              {brochure.manit.points.map((point) => (
                <li key={point} className="flex gap-3 text-ink">
                  <span className="mt-2 size-1.5 shrink-0 bg-ember" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="relative aspect-[5/4] overflow-hidden border border-line shadow-[var(--shadow-lift)]">
              <Image
                src={brochure.media.campus}
                alt="MANIT Bhopal main building"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-paper-elevated/95 px-3 py-2 backdrop-blur-sm">
                <Image
                  src={brochure.media.seal}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 object-contain"
                />
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-mute">
                  MANIT Bhopal
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="border-b border-line py-20 sm:py-28">
        <Container className="max-w-4xl">
          <Reveal>
            <DeskLabel index="02">Society</DeskLabel>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              {brochure.about.title}
            </h2>
            <p className="mt-6 text-xl leading-relaxed text-mute sm:text-2xl sm:leading-relaxed">
              {brochure.about.body}
            </p>
            <p className="mt-6 max-w-2xl leading-relaxed text-ink-soft">
              {brochure.about.vision}
            </p>
            <p className="mt-8 font-mono text-sm uppercase tracking-[0.2em] text-ember">
              {brochure.tagline}
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="overflow-hidden border-b border-line bg-void py-20 text-on-void sm:py-28">
        <Container>
          <Reveal>
            <DeskLabel index="03" tone="inverse">
              Fest
            </DeskLabel>
            <h2 className="mt-4 max-w-3xl font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-balance">
              {brochure.fest} — where tech meets culture
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-on-void-soft">
              {brochure.festAbout.body}
            </p>
          </Reveal>
        </Container>

        <div className="mt-12 grid gap-3 px-[var(--gutter)] lg:grid-cols-2">
          <Reveal className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={brochure.media.performersA}
              alt="Past performers at Techno × Maffick"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal delay={0.06} className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={brochure.media.performersB}
              alt="More past performers at Techno × Maffick"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
        </div>

        <div className="mt-10">
          <PerformerMarquee names={brochure.pastPerformers} />
        </div>
      </section>

      <section className="border-b border-line py-20 sm:py-28">
        <Container>
          <Reveal>
            <DeskLabel index="04">Reach</DeskLabel>
            <h2 className="mt-4 max-w-2xl font-display text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              What sponsors get from DataBiz
            </h2>
          </Reveal>
          <dl className="mt-10 divide-y divide-line border-y border-line">
            {brochure.faq.map((item, i) => (
              <Reveal key={item.q} delay={0.04 * i}>
                <div className="grid gap-3 py-7 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-12">
                  <dt className="font-display text-lg font-semibold tracking-tight text-ink">
                    {item.q}
                  </dt>
                  <dd className="leading-relaxed text-mute">{item.a}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </Container>
      </section>

      <section className="relative overflow-hidden border-b border-line py-20 sm:py-28">
        <Container>
          <Reveal>
            <DeskLabel index="05">Competitions</DeskLabel>
            <h2 className="mt-4 max-w-2xl font-display text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              Datathon &amp; Visathon
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-mute">
              Flagship analytics challenges judged by faculty and industry —
              methodology, accuracy, and storytelling under one roof.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {brochure.competitions.map((comp, i) => (
              <Reveal key={comp.name} delay={0.06 * i}>
                <article className="relative h-full overflow-hidden border border-line bg-paper-elevated p-7 shadow-[var(--shadow-soft)] sm:p-9">
                  <ChartMark
                    kind={i === 0 ? "bars" : "line"}
                    className="mb-5 h-16 w-24"
                  />
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ember">
                    {comp.subtitle}
                  </p>
                  <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                    {comp.name}
                  </h3>
                  <p className="mt-4 max-w-md leading-relaxed text-mute">
                    {comp.body}
                  </p>
                  <ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm text-ink-soft">
                    {comp.focus.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-ember" aria-hidden>
                          →
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="mt-16 grid gap-10 border-t border-line pt-12 md:grid-cols-3">
            {(
              [
                ["Why join", brochure.participate.why],
                ["Who", brochure.participate.who],
                ["Awards", brochure.participate.awards],
              ] as const
            ).map(([title, items], i) => (
              <Reveal key={title} delay={0.05 * i}>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-mute">
                  {title}
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-line bg-panel/40 py-20 sm:py-28">
        <Container className="grid items-center gap-12 lg:grid-cols-[1fr_0.95fr] lg:gap-16">
          <Reveal>
            <DeskLabel index="06">Podcast</DeskLabel>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              {brochure.podcast.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-mute">
              {brochure.podcast.body}
            </p>
            <p className="mt-4 leading-relaxed text-ink-soft">
              {brochure.podcast.featured}
            </p>
            <Button href="/show" variant="ember" size="md" className="mt-8">
              Open DataBrew
            </Button>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden border border-line shadow-[var(--shadow-ember)]">
              <Image
                src={brochure.media.databrewPoster}
                alt="The Data Brew Show with Ashutosh Sharma, Data Analyst at Zomato"
                fill
                sizes="(max-width: 1024px) 90vw, 420px"
                className="object-cover"
              />
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="relative overflow-hidden border-b border-line py-20 sm:py-28">
        <Container className="max-w-4xl">
          <Reveal>
            <DeskLabel index="07">Why sponsor</DeskLabel>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-balance">
              Be the brand students remember from MANIT
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-mute">
              {brochure.whySponsor.body}
            </p>
            <p className="mt-6 border-l-2 border-ember pl-5 text-xl leading-relaxed text-ink">
              {brochure.whySponsor.impact}
            </p>
          </Reveal>
        </Container>
      </section>

      <section
        id="packages"
        className="scroll-mt-24 border-b border-line py-20 sm:py-28"
      >
        <Container>
          <Reveal>
            <DeskLabel index="08">Packages</DeskLabel>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              Choose your signal strength
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-mute">
              {brochure.deliverablesNote}
            </p>
          </Reveal>

          <ul className="mt-14 grid gap-4 lg:grid-cols-5">
            {brochure.packages.map((pkg, i) => {
              const level = brochure.packages.length - i;
              return (
                <li key={pkg.name}>
                  <Reveal delay={0.05 * i} className="h-full">
                    <article
                      className={cn(
                        "brochure-ladder flex h-full flex-col border p-5 sm:p-6",
                        pkg.highlight
                          ? "border-ember shadow-[var(--shadow-ember)]"
                          : "border-line",
                      )}
                    >
                      <SignalBars level={level} />
                      <p className="mt-5 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-mute">
                        {pkg.name}
                      </p>
                      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
                        {pkg.amount}
                      </p>
                      <ul className="mt-5 flex-1 space-y-2.5 text-sm leading-relaxed text-mute">
                        {pkg.perks.map((perk) => (
                          <li key={perk}>{perk}</li>
                        ))}
                      </ul>
                      <Button
                        href={`mailto:${site.email}?subject=${encodeURIComponent(`Sponsorship — ${pkg.name} package`)}`}
                        variant={pkg.highlight ? "ember" : "ghost"}
                        size="sm"
                        className="mt-6 w-full"
                      >
                        Inquire
                      </Button>
                    </article>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      <section className="border-b border-line bg-void py-20 text-on-void sm:py-28">
        <Container>
          <Reveal>
            <DeskLabel index="09" tone="inverse">
              Barter
            </DeskLabel>
            <h2 className="mt-4 max-w-2xl font-display text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              Prefer value exchange? Build an associate track
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-10 lg:grid-cols-3">
            {brochure.barter.map((tier, i) => (
              <Reveal key={tier.name} delay={0.06 * i}>
                <div className="border border-on-void-line bg-void-soft/40 p-6">
                  <h3 className="font-display text-2xl font-semibold tracking-tight">
                    {tier.name}
                  </h3>
                  <p className="mt-6 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ember">
                    From DataBiz
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-on-void-soft">
                    {tier.fromUs.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="mt-6 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ember">
                    From you
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-on-void-soft">
                    {tier.fromYou.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="relative overflow-hidden py-24 sm:py-32">
        <Image
          src={brochure.media.campus}
          alt=""
          fill
          aria-hidden
          sizes="100vw"
          className="object-cover opacity-20"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--paper) 92%, transparent), color-mix(in srgb, var(--paper) 96%, transparent))",
          }}
        />
        <Container className="relative grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
          <Reveal>
            <DeskLabel index="10">Contact</DeskLabel>
            <h2 className="mt-4 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-balance">
              Let&apos;s build the next fest together.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-mute">
              Write to{" "}
              <a
                href={`mailto:${site.email}`}
                className="font-medium text-ember hover:underline"
              >
                {site.email}
              </a>
              . Prefer print?{" "}
              <Link
                href={brochure.pdfHref}
                className="font-medium text-ember hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download the PDF
              </Link>
              .
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                href={`mailto:${site.email}?subject=${encodeURIComponent("Sponsorship inquiry — DataBiz")}`}
                variant="primary"
                size="lg"
              >
                Email the core
              </Button>
              <Button href="/contact" variant="ghost" size="lg">
                Contact form
              </Button>
              <Button href="/sponsors" variant="link">
                Current sponsors
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="space-y-6">
            <ul className="divide-y divide-line border-y border-line bg-paper-elevated/90 backdrop-blur-sm">
              {brochure.contacts.map((person) => (
                <li
                  key={`${person.name}-${person.phone}`}
                  className="flex flex-wrap items-baseline justify-between gap-3 px-1 py-5"
                >
                  <span className="font-display text-lg font-semibold tracking-tight text-ink">
                    {person.name}
                  </span>
                  <a
                    href={`tel:+91${person.phone.replace(/\s/g, "")}`}
                    className="font-mono text-sm text-mute hover:text-ember"
                  >
                    {person.phone}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-6">
              <Image
                src={brochure.media.instagramQr}
                alt="Instagram QR for @databiz_nitb"
                width={160}
                height={220}
                className="h-40 w-auto border border-line bg-paper-elevated"
              />
              <div className="text-sm">
                {site.socials.instagram ? (
                  <a
                    href={site.socials.instagram}
                    className="block font-medium text-ember hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @databiz_nitb
                  </a>
                ) : null}
                {site.socials.linkedin ? (
                  <a
                    href={site.socials.linkedin}
                    className="mt-2 block text-mute hover:text-ember hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                ) : null}
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
