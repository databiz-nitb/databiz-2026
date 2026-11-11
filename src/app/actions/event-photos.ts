"use server";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, isDatabaseConfigured } from "@/db";
import { eventPhotos, events } from "@/db/schema";
import type { ActionResult } from "@/app/actions/events";
import { canPublish } from "@/lib/roles";
import { requireDesk } from "@/lib/session";

function requireDb(): ActionResult | null {
  if (!isDatabaseConfigured() || !getDb()) {
    return {
      ok: false,
      error:
        "DATABASE_URL is not set. Add Neon credentials to .env.local and run pnpm db:push.",
    };
  }
  return null;
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function collectPublicIds(formData: FormData): string[] {
  const fromMulti = formData
    .getAll("publicId")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  if (fromMulti.length > 0) return [...new Set(fromMulti)];

  const rawJson = formString(formData, "publicIds").trim();
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as unknown;
      if (Array.isArray(parsed)) {
        return [
          ...new Set(
            parsed
              .filter((value): value is string => typeof value === "string")
              .map((value) => value.trim())
              .filter(Boolean),
          ),
        ];
      }
    } catch {
      // fall through
    }
  }

  const single = formString(formData, "publicId").trim();
  return single ? [single] : [];
}

function collectPhotoCaptions(formData: FormData, publicIds: string[]) {
  const individualCaptions = formData
    .getAll("photoCaption")
    .map((value) => (typeof value === "string" ? value.trim() : ""));
  if (individualCaptions.length > 0) {
    if (individualCaptions.length !== publicIds.length) {
      return { error: "Add a caption field for each photo." };
    }
    return { captions: individualCaptions };
  }

  const caption = formString(formData, "caption").trim();
  return { captions: publicIds.map(() => caption) };
}

export async function addEventPhoto(
  eventId: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireDesk();
  const blocked = requireDb();
  if (blocked) return blocked;

  const publicIds = collectPublicIds(formData);
  const photoCaptions = collectPhotoCaptions(formData, publicIds);
  if (photoCaptions.error) return { ok: false, error: photoCaptions.error };

  const parsed = z
    .object({
      publicIds: z.array(z.string().min(1)).min(1, "Upload at least one photo."),
      captions: z.array(z.string().max(300)).min(1),
    })
    .safeParse({ publicIds, captions: photoCaptions.captions });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid form." };
  }

  const db = getDb()!;
  const [event] = await db
    .select({ id: events.id, slug: events.slug, status: events.status })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!event) return { ok: false, error: "Event not found." };

  // Members may only attach photos to draft events; admin publishes the event.
  if (!canPublish(session.user.role) && event.status !== "draft") {
    return {
      ok: false,
      error:
        "Members can upload gallery photos only on draft events. Ask an admin to attach photos to a live event, or keep the event in draft until approved.",
    };
  }

  const [album] = await db
    .select({ customEventName: eventPhotos.customEventName })
    .from(eventPhotos)
    .where(and(eq(eventPhotos.eventId, eventId), isNotNull(eventPhotos.customEventName)))
    .limit(1);
  const baseOrder = Math.floor(Date.now() / 1000);
  await db.insert(eventPhotos).values(
    parsed.data.publicIds.map((publicId, index) => ({
      id: crypto.randomUUID(),
      eventId,
      customEventName: album?.customEventName ?? null,
      publicId,
      caption: parsed.data.captions[index]!,
      sortOrder: baseOrder + index,
    })),
  );

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath(`/events/${event.slug}`);
  return { ok: true };
}

export async function deleteEventPhoto(
  photoId: string,
  eventId: string | null,
): Promise<ActionResult> {
  const session = await requireDesk();
  if (!eventId && !canPublish(session.user.role)) {
    return {
      ok: false,
      error: "Only admins can remove standalone gallery albums.",
    };
  }
  const blocked = requireDb();
  if (blocked) return blocked;

  const db = getDb()!;
  const [event] = eventId
    ? await db
        .select({ slug: events.slug, status: events.status })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1)
    : [undefined];
  if (!canPublish(session.user.role) && event?.status !== "draft") {
    return {
      ok: false,
      error: "Only admins can remove photos from published gallery albums.",
    };
  }

  await db
    .delete(eventPhotos)
    .where(
      and(
        eq(eventPhotos.id, photoId),
        eventId
          ? eq(eventPhotos.eventId, eventId)
          : isNull(eventPhotos.eventId),
      ),
    );
  if (eventId) revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  if (event?.slug) revalidatePath(`/events/${event.slug}`);
  return { ok: true };
}

export async function updateGalleryAlbum(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireDesk();
  if (!canPublish(session.user.role)) {
    return { ok: false, error: "Only admins can edit published gallery albums." };
  }
  const blocked = requireDb();
  if (blocked) return blocked;

  const eventId = formString(formData, "eventId").trim();
  const currentName = formString(formData, "currentName").trim();
  const name = formString(formData, "name").trim();
  const parsed = z
    .object({
      eventId: z.string(),
      currentName: z.string(),
      name: z.string().min(1, "Album name is required.").max(
        120,
        "Album name must be 120 characters or fewer.",
      ),
    })
    .safeParse({ eventId, currentName, name });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid album name." };
  }
  if (!eventId && !currentName) {
    return { ok: false, error: "Gallery album not found." };
  }

  const db = getDb()!;
  if (eventId) {
    const [event] = await db
      .select({ id: events.id, slug: events.slug })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    if (!event) return { ok: false, error: "Event not found." };
    await db
      .update(eventPhotos)
      .set({ customEventName: name })
      .where(eq(eventPhotos.eventId, eventId));
    revalidatePath(`/events/${event.slug}`);
  } else {
    if (name !== currentName) {
      const [collision] = await db
        .select({ id: eventPhotos.id })
        .from(eventPhotos)
        .where(and(isNull(eventPhotos.eventId), eq(eventPhotos.customEventName, name)))
        .limit(1);
      if (collision) {
        return {
          ok: false,
          error: "A standalone album with that name already exists.",
        };
      }
    }
    const updated = await db
      .update(eventPhotos)
      .set({ customEventName: name })
      .where(
        and(
          isNull(eventPhotos.eventId),
          eq(eventPhotos.customEventName, currentName),
        ),
      )
      .returning({ id: eventPhotos.id });
    if (updated.length === 0) return { ok: false, error: "Gallery album not found." };
  }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  return { ok: true };
}

export async function updateGalleryPhoto(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireDesk();
  if (!canPublish(session.user.role)) {
    return { ok: false, error: "Only admins can edit published gallery photos." };
  }
  const blocked = requireDb();
  if (blocked) return blocked;

  const parsed = z
    .object({
      photoId: z.string().min(1),
      publicId: z.string().min(1, "Choose or upload an image."),
      caption: z.string().max(300, "Caption must be 300 characters or fewer."),
    })
    .safeParse({
      photoId: formString(formData, "photoId").trim(),
      publicId: formString(formData, "publicId").trim(),
      caption: formString(formData, "caption").trim(),
    });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid photo." };
  }

  const db = getDb()!;
  const [photo] = await db
    .select({ id: eventPhotos.id, eventId: eventPhotos.eventId })
    .from(eventPhotos)
    .where(eq(eventPhotos.id, parsed.data.photoId))
    .limit(1);
  if (!photo) return { ok: false, error: "Gallery photo not found." };

  await db
    .update(eventPhotos)
    .set({ publicId: parsed.data.publicId, caption: parsed.data.caption })
    .where(eq(eventPhotos.id, photo.id));

  if (photo.eventId) {
    const [event] = await db
      .select({ slug: events.slug })
      .from(events)
      .where(eq(events.id, photo.eventId))
      .limit(1);
    if (event) revalidatePath(`/events/${event.slug}`);
  }
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  return { ok: true };
}

export async function addPhotosToGalleryAlbum(
  eventId: string | null,
  albumName: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireDesk();
  if (!canPublish(session.user.role)) {
    return { ok: false, error: "Only admins can edit published gallery albums." };
  }
  const blocked = requireDb();
  if (blocked) return blocked;

  const publicIds = collectPublicIds(formData);
  const photoCaptions = collectPhotoCaptions(formData, publicIds);
  if (photoCaptions.error) return { ok: false, error: photoCaptions.error };
  const parsed = z
    .object({
      publicIds: z.array(z.string().min(1)).min(1, "Choose at least one photo."),
      captions: z.array(z.string().max(300)).min(1),
      albumName: z.string().min(1).max(120),
    })
    .safeParse({
      publicIds,
      captions: photoCaptions.captions,
      albumName: albumName.trim(),
    });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid photos." };
  }

  const db = getDb()!;
  if (eventId) {
    const [event] = await db
      .select({ id: events.id, slug: events.slug })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    if (!event) return { ok: false, error: "Event not found." };
    const [photo] = await db
      .select({ id: eventPhotos.id })
      .from(eventPhotos)
      .where(eq(eventPhotos.eventId, eventId))
      .limit(1);
    if (!photo) return { ok: false, error: "Gallery album not found." };
    revalidatePath(`/events/${event.slug}`);
  } else {
    const [photo] = await db
      .select({ id: eventPhotos.id })
      .from(eventPhotos)
      .where(
        and(
          isNull(eventPhotos.eventId),
          eq(eventPhotos.customEventName, parsed.data.albumName),
        ),
      )
      .limit(1);
    if (!photo) return { ok: false, error: "Gallery album not found." };
  }

  const baseOrder = Math.floor(Date.now() / 1000);
  await db.insert(eventPhotos).values(
    parsed.data.publicIds.map((publicId, index) => ({
      id: crypto.randomUUID(),
      eventId,
      customEventName: parsed.data.albumName,
      publicId,
      caption: parsed.data.captions[index]!,
      sortOrder: baseOrder + index,
    })),
  );
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  return { ok: true };
}

export async function addGalleryPhoto(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireDesk();
  const blocked = requireDb();
  if (blocked) return blocked;

  const eventId = formString(formData, "eventId").trim();
  const customEventName = formString(formData, "customEventName").trim();
  const publicIds = collectPublicIds(formData);
  const photoCaptions = collectPhotoCaptions(formData, publicIds);
  if (photoCaptions.error) return { ok: false, error: photoCaptions.error };
  const parsed = z
    .object({
      publicIds: z.array(z.string().min(1)).min(1, "Upload at least one photo."),
      captions: z.array(z.string().max(300)).min(1),
      customEventName: z.string().max(
        120,
        "Custom event name must be 120 characters or fewer.",
      ),
    })
    .safeParse({ publicIds, captions: photoCaptions.captions, customEventName });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid form." };
  }

  if (customEventName) {
    if (eventId) {
      return { ok: false, error: "Choose an existing event or a custom album." };
    }
    if (!canPublish(session.user.role)) {
      return {
        ok: false,
        error: "Only admins can publish standalone gallery albums.",
      };
    }
    const baseOrder = Math.floor(Date.now() / 1000);
    await getDb()!.insert(eventPhotos).values(
      parsed.data.publicIds.map((publicId, index) => ({
        id: crypto.randomUUID(),
        eventId: null,
        customEventName: parsed.data.customEventName,
        publicId,
        caption: parsed.data.captions[index]!,
        sortOrder: baseOrder + index,
      })),
    );
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { ok: true };
  }

  if (!eventId) {
    return { ok: false, error: "Pick an event for this photo." };
  }

  return addEventPhoto(eventId, undefined, formData);
}
