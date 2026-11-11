import { asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import { eventPhotos, events } from "@/db/schema";
import { mediaUrl } from "@/lib/media";

export type EventPhotoItem = {
  id: string;
  eventId: string | null;
  customEventName: string | null;
  publicId: string;
  url?: string;
  caption: string;
  sortOrder: number;
};

export type GalleryPhotoItem = EventPhotoItem & {
  eventSlug: string | null;
  eventTitle: string;
  eventStartsAt: string | null;
  galleryKey: string;
};

export type GalleryEventSection = {
  galleryKey: string;
  eventId: string | null;
  eventSlug: string | null;
  eventTitle: string;
  eventStartsAt: string | null;
  photos: GalleryPhotoItem[];
};

/** Group flat gallery photos into event sections (newest event first). */
export function groupGalleryByEvent(
  photos: GalleryPhotoItem[],
): GalleryEventSection[] {
  const sections = new Map<string, GalleryEventSection>();

  for (const photo of photos) {
    const galleryKey = photo.eventId
      ? `event:${photo.eventId}`
      : `custom:${photo.customEventName ?? "untitled"}`;
    const existing = sections.get(galleryKey);
    if (existing) {
      existing.photos.push(photo);
      continue;
    }
    sections.set(galleryKey, {
      galleryKey,
      eventId: photo.eventId,
      eventSlug: photo.eventSlug,
      eventTitle: photo.eventTitle,
      eventStartsAt: photo.eventStartsAt,
      photos: [photo],
    });
  }

  return [...sections.values()].sort(
    (a, b) =>
      (b.eventStartsAt ? new Date(b.eventStartsAt).getTime() : 0) -
      (a.eventStartsAt ? new Date(a.eventStartsAt).getTime() : 0),
  );
}

function mapRow(row: typeof eventPhotos.$inferSelect): EventPhotoItem {
  return {
    id: row.id,
    eventId: row.eventId,
    customEventName: row.customEventName,
    publicId: row.publicId,
    url: mediaUrl(row.publicId),
    caption: row.caption,
    sortOrder: row.sortOrder,
  };
}

export async function listEventPhotos(
  eventId: string,
): Promise<EventPhotoItem[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(eventPhotos)
    .where(eq(eventPhotos.eventId, eventId))
    .orderBy(asc(eventPhotos.sortOrder));
  return rows.map(mapRow);
}

/** Admin gallery: all event photos, newest events first. */
export async function listAdminGalleryPhotos(): Promise<GalleryPhotoItem[]> {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(eventPhotos)
    .orderBy(asc(eventPhotos.sortOrder));

  const eventIds = [...new Set(rows.flatMap((row) => row.eventId ?? []))];
  const allEvents = eventIds.length
    ? await db
        .select({
          id: events.id,
          slug: events.slug,
          title: events.title,
          startsAt: events.startsAt,
        })
        .from(events)
        .where(inArray(events.id, eventIds))
    : [];
  const eventMap = new Map(allEvents.map((event) => [event.id, event]));

  const items: GalleryPhotoItem[] = [];
  for (const row of rows) {
    const event = row.eventId ? eventMap.get(row.eventId) : undefined;
    if (!event && !row.customEventName) continue;
    items.push({
      ...mapRow(row),
      eventSlug: event?.slug ?? null,
      eventTitle: event?.title ?? row.customEventName!,
      eventStartsAt: event?.startsAt.toISOString() ?? null,
      galleryKey: event ? `event:${event.id}` : `custom:${row.customEventName}`,
    });
  }

  items.sort((a, b) => {
    const byEvent =
      (b.eventStartsAt ? new Date(b.eventStartsAt).getTime() : 0) -
      (a.eventStartsAt ? new Date(a.eventStartsAt).getTime() : 0);
    if (byEvent !== 0) return byEvent;
    return a.sortOrder - b.sortOrder;
  });

  return items;
}

/** Public gallery: photos from non-draft events, newest events first. */
export async function listGalleryPhotos(): Promise<GalleryPhotoItem[]> {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select({
      photo: eventPhotos,
      event: events,
    })
    .from(eventPhotos)
    .leftJoin(events, eq(eventPhotos.eventId, events.id))
    .where(
      or(
        isNull(eventPhotos.eventId),
        inArray(events.status, ["past", "published"]),
      ),
    )
    .orderBy(desc(events.startsAt), asc(eventPhotos.sortOrder));

  const items: GalleryPhotoItem[] = [];
  for (const row of rows) {
    const event = row.event;
    const photo = row.photo;
    if (!event && !photo.customEventName) continue;
    const galleryKey = event
      ? `event:${event.id}`
      : `custom:${photo.customEventName}`;
    items.push({
      ...mapRow(photo),
      eventSlug: event?.slug ?? null,
      eventTitle: event?.title ?? photo.customEventName!,
      eventStartsAt: event?.startsAt.toISOString() ?? null,
      galleryKey,
    });
  }

  // Keep photos grouped by event order (newest event first).
  items.sort((a, b) => {
    const byEvent =
      (b.eventStartsAt ? new Date(b.eventStartsAt).getTime() : 0) -
      (a.eventStartsAt ? new Date(a.eventStartsAt).getTime() : 0);
    if (byEvent !== 0) return byEvent;
    return a.sortOrder - b.sortOrder;
  });

  return items;
}
