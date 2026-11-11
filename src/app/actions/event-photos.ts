"use server";

import { and, eq, isNull } from "drizzle-orm";
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

export async function addEventPhoto(
  eventId: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireDesk();
  const blocked = requireDb();
  if (blocked) return blocked;

  const publicIds = collectPublicIds(formData);
  const caption = formString(formData, "caption").trim();

  const parsed = z
    .object({
      publicIds: z.array(z.string().min(1)).min(1, "Upload at least one photo."),
      caption: z.string().default(""),
    })
    .safeParse({ publicIds, caption });

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

  const baseOrder = Date.now() % 100000;
  await db.insert(eventPhotos).values(
    parsed.data.publicIds.map((publicId, index) => ({
      id: crypto.randomUUID(),
      eventId,
      publicId,
      caption: parsed.data.caption,
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
        .select({ slug: events.slug })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1)
    : [undefined];

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
  const caption = formString(formData, "caption").trim();
  const parsed = z
    .object({
      publicIds: z.array(z.string().min(1)).min(1, "Upload at least one photo."),
      caption: z.string().max(300, "Caption must be 300 characters or fewer."),
      customEventName: z.string().max(
        120,
        "Custom event name must be 120 characters or fewer.",
      ),
    })
    .safeParse({ publicIds, caption, customEventName });

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
    await getDb()!.insert(eventPhotos).values(
      parsed.data.publicIds.map((publicId, index) => ({
        id: crypto.randomUUID(),
        eventId: null,
        customEventName: parsed.data.customEventName,
        publicId,
        caption: parsed.data.caption,
        sortOrder: (Date.now() % 100000) + index,
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
