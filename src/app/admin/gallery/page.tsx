import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Container } from "@/components/ui/Container";
import { GalleryAdminForm } from "@/components/admin/GalleryAdminForm";
import { isDatabaseConfigured } from "@/db";
import { listAdminGalleryPhotos } from "@/lib/event-photos";
import { isEventsDbReady, listAdminEvents } from "@/lib/events";

export const metadata: Metadata = { title: "Admin · Gallery" };

async function AdminGalleryContent() {
  await connection();

  const dbReady = isDatabaseConfigured() && isEventsDbReady();
  const events = dbReady ? await listAdminEvents() : [];
  const photos = dbReady ? await listAdminGalleryPhotos() : [];

  return (
    <Container className="py-10 sm:py-12">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Gallery
        </h1>
        <p className="mt-2 text-mute leading-relaxed">
          Admins upload event photos here. They show on the public `/gallery`
          page and on each past event. Team headshots are managed under Team.
        </p>
      </div>

      {!dbReady ? (
        <p className="mt-8 text-sm text-mute">
          Connect Neon to upload gallery photos.
        </p>
      ) : (
        <div className="mt-10">
          <GalleryAdminForm
            events={events.map((event) => ({
              id: event.id!,
              title: event.title,
              slug: event.slug,
              status: event.status,
            }))}
            photos={photos}
          />
        </div>
      )}
    </Container>
  );
}

export default function AdminGalleryPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-10 sm:py-12">
          <p className="text-sm text-mute">Loading gallery…</p>
        </Container>
      }
    >
      <AdminGalleryContent />
    </Suspense>
  );
}
