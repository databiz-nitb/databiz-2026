import { desc, eq, inArray, isNull, or } from "drizzle-orm";
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
  eventStatus: string | null;
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

/** Group photos into sections ordered by the most recently added photo. */
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

  const groupedSections = [...sections.values()];
  for (const section of groupedSections) {
    section.photos.sort((a, b) => b.sortOrder - a.sortOrder);
  }
  return groupedSections.sort(
    (a, b) =>
      (b.photos[0]?.sortOrder ?? 0) - (a.photos[0]?.sortOrder ?? 0),
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
    .orderBy(desc(eventPhotos.sortOrder));
  return rows.map(mapRow);
}

/** Admin gallery: all event photos, newest events first. */
export async function listAdminGalleryPhotos(): Promise<GalleryPhotoItem[]> {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(eventPhotos)
    .orderBy(desc(eventPhotos.sortOrder));

  const eventIds = [...new Set(rows.flatMap((row) => row.eventId ?? []))];
  const allEvents = eventIds.length
    ? await db
        .select({
          id: events.id,
          slug: events.slug,
          title: events.title,
          startsAt: events.startsAt,
          status: events.status,
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
      eventTitle: row.customEventName ?? event?.title ?? "",
      eventStartsAt: event?.startsAt.toISOString() ?? null,
      eventStatus: event?.status ?? null,
      galleryKey: event ? `event:${event.id}` : `custom:${row.customEventName}`,
    });
  }

  items.sort((a, b) => b.sortOrder - a.sortOrder);

  return items;
}

/** Public gallery: photos from non-draft events, newest uploads first. */
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
    .orderBy(desc(eventPhotos.sortOrder));

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
      eventTitle: photo.customEventName ?? event?.title ?? "",
      eventStartsAt: event?.startsAt.toISOString() ?? null,
      eventStatus: event?.status ?? null,
      galleryKey,
    });
  }

  items.sort((a, b) => b.sortOrder - a.sortOrder);

  return items;
}
