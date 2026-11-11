import { Suspense } from "react";
import { connection } from "next/server";
import { HomeHero } from "@/components/home/HomeHero";
import { HomePageLoader } from "@/components/home/HomePageLoader";
import { HomePageShell } from "@/components/home/HomePageShell";
import { HomeExplore } from "@/components/home/HomeExplore";
import { HomeIndex } from "@/components/home/HomeIndex";
import { HomeSponsorsApproach } from "@/components/home/HomeSponsorsApproach";
import { HomeMission } from "@/components/home/HomeMission";
import { HomeContactStrip } from "@/components/home/HomeContactStrip";
import { Button } from "@/components/ui/Button";
import { getNextEvent, getPastEvents } from "@/lib/events";
import { getPublishedPosts } from "@/lib/posts";
import { getLatestEpisode } from "@/lib/episodes";
import { getOpenDrive } from "@/lib/drives";

async function HomeContent() {
  await connection();

  const [nextEvent, pastEvents, publishedPosts, latestEpisode, openDrive] =
    await Promise.all([
      getNextEvent(),
      getPastEvents(),
      getPublishedPosts(),
      getLatestEpisode(),
      getOpenDrive(),
    ]);
  const pastEvent = pastEvents[0] ?? null;
  const latestPost = publishedPosts[0] ?? null;

  return (
    <>
      <HomeHero>
        {openDrive ? (
          <p className="mt-8 border-l-2 border-ember pl-4 text-sm text-ink-soft">
            Applications are open.{" "}
            <Button
              href={`/join/${openDrive.slug}`}
              variant="link"
              className="inline text-sm"
            >
              Apply to the drive
            </Button>
          </p>
        ) : null}
      </HomeHero>
      <HomeExplore />
      <HomeIndex
        nextEvent={nextEvent}
        latestPost={latestPost}
        latestEpisode={latestEpisode}
        pastEvent={pastEvent}
      />
      <HomeSponsorsApproach />
      <HomeMission />
      <HomeContactStrip />
    </>
  );
}

export default function HomePage() {
  return (
    <HomePageShell>
      <Suspense fallback={<HomePageLoader />}>
        <HomeContent />
      </Suspense>
    </HomePageShell>
  );
}
