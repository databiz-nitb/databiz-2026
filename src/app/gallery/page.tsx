import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  groupGalleryByEvent,
  listGalleryPhotos,
} from "@/lib/event-photos";
import { formatDate } from "@/lib/utils";
import { GalleryImage } from "@/components/gallery/GalleryImage";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from DataBiz events and sessions at NIT Bhopal.",
};

async function GallerySections() {
  await connection();
  const photos = await listGalleryPhotos();
  const sections = groupGalleryByEvent(photos);

  if (sections.length === 0) {
    return (
      <EmptyState
        label="Gallery"
        title="No photos published yet."
        body="After a session, the core adds photos on the event page. They show up here for everyone."
        action={{ href: "/events", label: "See events" }}
      />
    );
  }

  return (
    <div className="space-y-16 sm:space-y-20">
      {sections.map((section, sectionIndex) => (
        <Reveal key={section.galleryKey} y={14} delay={0.04 * Math.min(sectionIndex, 6)}>
          <section aria-labelledby={`gallery-event-${section.galleryKey}`}>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
              <div>
                {section.eventStartsAt ? (
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-mute">
                    {formatDate(section.eventStartsAt)}
                  </p>
                ) : (
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-mute">
                    Gallery album
                  </p>
                )}
                <h2
                  id={`gallery-event-${section.galleryKey}`}
                  className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink"
                >
                  {section.eventTitle}
                </h2>
              </div>
              {section.eventSlug ? (
                <Link
                  href={`/events/${section.eventSlug}`}
                  className="text-sm font-medium text-ember hover:underline"
                >
                  Event page
                </Link>
              ) : null}
            </div>

            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.photos.map((photo) => (
                <li
                  key={photo.id}
                  className="overflow-hidden rounded-[var(--radius)] border border-line bg-paper-elevated"
                >
                  {photo.url ? (
                    <GalleryImage
                      src={photo.url}
                      alt={photo.caption || photo.eventTitle}
                      caption={photo.caption || photo.eventTitle}
                    />
                  ) : (
                    <div className="aspect-[4/3] w-full bg-panel" aria-hidden />
                  )}
                  {photo.caption ? (
                    <p className="p-4 text-sm text-steel">{photo.caption}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      ))}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <>
      <PageHero
        index="07"
        label="Gallery"
        title="What the room looked like."
        description="Photos from workshops, talks, and DataBrew sessions — grouped by event."
      />
      <section className="py-16 sm:py-20">
        <Container>
          <Suspense fallback={<p className="text-sm text-mute">Loading gallery…</p>}>
            <GallerySections />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
