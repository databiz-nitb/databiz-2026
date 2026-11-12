import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentTeam } from "@/lib/team";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Team",
  description: "The core team running DataBiz at NIT Bhopal.",
};

async function TeamGrid() {
  await connection();
  const team = await getCurrentTeam();

  if (team.length === 0) {
    return (
      <EmptyState
        label="Team"
        title="The core will publish the roster here."
        body="We do not list names until the current core confirms them. Check back soon, or write to us if you need to reach someone now."
        action={{ href: "/contact", label: "Contact the core" }}
      />
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {team.map((member, i) => (
        <li key={member.id}>
          <Reveal
            y={12}
            delay={0.04 * i}
            className="surface-card surface-card-hover flex h-full flex-col overflow-hidden rounded-[var(--radius)]"
          >
            <div className="relative aspect-[4/3] w-full bg-panel">
              {member.photoUrl ? (
                <Image
                  src={member.photoUrl}
                  alt={`Portrait of ${member.name}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-top"
                />
              ) : (
                <div
                  aria-hidden
                  className="flex h-full w-full items-center justify-center font-display text-5xl font-bold text-ember"
                >
                  {member.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <h2 className="font-display text-xl font-bold tracking-tight">
                {member.name}
              </h2>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ember">
                {member.roleTitle}
                {member.yearLabel ? ` · ${member.yearLabel}` : ""}
              </p>
              {member.bio ? (
                <p className="mt-1 text-sm leading-relaxed text-mute">
                  {member.bio}
                </p>
              ) : null}
            </div>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

export default function TeamPage() {
  return (
    <>
      <PageHero
        index="02"
        label="Team"
        title="The people behind the sessions."
        description="Roles rotate each year. Names appear here only once the core has published them."
      />
      <section className="py-16 sm:py-20">
        <Container>
          <Suspense
            fallback={<p className="text-sm text-mute">Loading roster…</p>}
          >
            <TeamGrid />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
