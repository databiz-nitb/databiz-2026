"use server";

import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, isDatabaseConfigured } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { fromDatetimeLocalValue } from "@/lib/datetime";
import { sendTransactionalEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { clampToDraftIfNeeded } from "@/lib/publish";
import { requireAdmin, requireDesk, getSession } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { createTicketCode, parseTicketCode } from "@/lib/tickets";

export type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  ticketId?: string;
  ticketCode?: string;
};

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => !value || /^https?:\/\//i.test(value),
    "Use a full URL starting with http:// or https://.",
  );

const eventFields = z.object({
  title: z.string().trim().min(1, "Title is required."),
  slug: z.string().trim().optional(),
  summary: z.string().trim().default(""),
  body: z.string().trim().default(""),
  venue: z.string().trim().default(""),
  meetingUrl: optionalUrl,
  startsAt: z.string().min(1, "Start time is required."),
  endsAt: z.string().min(1, "End time is required."),
  capacity: z.string().optional(),
  rsvpDeadline: z.string().optional(),
  status: z.enum(["draft", "published", "past"]),
  recapBody: z.string().trim().optional(),
  recordingUrl: optionalUrl,
  posterPublicId: z.string().trim().optional(),
  template: z.enum(["default", "fest"]).default("default"),
});

const rsvpFields = z.object({
  eventId: z.string().min(1),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  year: z.string().trim().min(1, "Year is required."),
  branch: z.string().trim().min(1, "Branch is required."),
});

function requireEventsDb(): ActionResult | null {
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

/** Prefer the clicked submit button (`intent`) over the status <select>. */
function resolveEventStatus(
  formData: FormData,
): "draft" | "published" | "past" {
  const intent = formString(formData, "intent");
  if (intent === "publish") return "published";
  if (intent === "draft") return "draft";
  if (intent === "past") return "past";
  const status = formString(formData, "status");
  if (status === "published" || status === "past") return status;
  return "draft";
}

function parseEventForm(formData: FormData) {
  return eventFields.safeParse({
    title: formString(formData, "title"),
    slug: formString(formData, "slug") || undefined,
    summary: formString(formData, "summary"),
    body: formString(formData, "body"),
    venue: formString(formData, "venue"),
    meetingUrl: formString(formData, "meetingUrl") || undefined,
    startsAt: formString(formData, "startsAt"),
    endsAt: formString(formData, "endsAt"),
    capacity: formString(formData, "capacity"),
    rsvpDeadline: formString(formData, "rsvpDeadline"),
    status: resolveEventStatus(formData),
    recapBody: formString(formData, "recapBody") || undefined,
    recordingUrl: formString(formData, "recordingUrl") || undefined,
    posterPublicId: formString(formData, "posterPublicId") || undefined,
    template: formString(formData, "template") || "default",
  });
}

function fieldErrorsFromZod(
  error: z.ZodError,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

async function uniqueSlug(base: string, excludeId?: string) {
  const db = getDb()!;
  let candidate = slugify(base) || `event-${Date.now()}`;
  let attempt = 0;

  while (attempt < 20) {
    const [existing] = await db
      .select({ id: events.id })
      .from(events)
      .where(
        excludeId
          ? and(eq(events.slug, candidate), ne(events.id, excludeId))
          : eq(events.slug, candidate),
      )
      .limit(1);

    if (!existing) return candidate;
    attempt += 1;
    candidate = `${slugify(base) || "event"}-${attempt + 1}`;
  }

  return `${candidate}-${crypto.randomUUID().slice(0, 8)}`;
}

function toEventValues(
  data: z.infer<typeof eventFields>,
  slug: string,
  existingPublishedAt?: Date | null,
) {
  const startsAt = fromDatetimeLocalValue(data.startsAt);
  const endsAt = fromDatetimeLocalValue(data.endsAt);
  if (!startsAt || !endsAt) {
    throw new Error("Invalid start or end time.");
  }
  if (endsAt <= startsAt) {
    throw new Error("End time must be after start time.");
  }

  const capacityRaw = data.capacity?.trim();
  const capacity =
    capacityRaw && capacityRaw.length > 0 ? Number(capacityRaw) : null;
  if (capacity != null && (!Number.isFinite(capacity) || capacity < 1)) {
    throw new Error("Capacity must be a positive number or empty.");
  }

  const rsvpDeadline = data.rsvpDeadline
    ? fromDatetimeLocalValue(data.rsvpDeadline)
    : null;

  const publishedAt =
    data.status === "draft"
      ? null
      : existingPublishedAt ?? new Date();

  return {
    title: data.title,
    slug,
    summary: data.summary,
    body: data.body,
    venue: data.venue || null,
    meetingUrl: data.meetingUrl || null,
    startsAt,
    endsAt,
    capacity,
    rsvpDeadline,
    status: data.status,
    recapBody: data.recapBody || null,
    recordingUrl: data.recordingUrl || null,
    posterPublicId: data.posterPublicId || null,
    template: data.template,
    publishedAt,
    updatedAt: new Date(),
  };
}

export async function createEvent(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireDesk();
  const blocked = requireEventsDb();
  if (blocked) return blocked;

  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Fix the highlighted fields and try again.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const status = clampToDraftIfNeeded(
    session.user.role,
    parsed.data.status,
    "draft",
  );
  const data = { ...parsed.data, status };

  let id: string;
  try {
    const db = getDb()!;
    const slug = await uniqueSlug(data.slug?.trim() || data.title);
    const values = toEventValues(data, slug);
    id = crypto.randomUUID();

    await db.insert(events).values({
      id,
      ...values,
      createdAt: new Date(),
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create event.",
    };
  }

  revalidatePath("/events");
  revalidatePath("/");
  revalidatePath("/admin/events");
  redirect(`/admin/events/${id}`);
}

export async function updateEvent(
  eventId: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireDesk();
  const blocked = requireEventsDb();
  if (blocked) return blocked;

  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Fix the highlighted fields and try again.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const status = clampToDraftIfNeeded(
    session.user.role,
    parsed.data.status,
    "draft",
  );
  const data = { ...parsed.data, status };

  try {
    const db = getDb()!;
    const [existing] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!existing) return { ok: false, error: "Event not found." };

    const requestedSlug = data.slug?.trim();
    const slug =
      requestedSlug && requestedSlug !== existing.slug
        ? await uniqueSlug(requestedSlug, eventId)
        : existing.slug;

    const values = toEventValues(data, slug, existing.publishedAt);

    await db.update(events).set(values).where(eq(events.id, eventId));

    revalidatePath("/events");
    revalidatePath(`/events/${slug}`);
    if (existing.slug !== slug) revalidatePath(`/events/${existing.slug}`);
    revalidatePath("/");
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${eventId}`);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update event.",
    };
  }
}

export async function registerForEvent(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      error: "Please sign in to your DataBiz account before registering.",
    };
  }

  const sessionEmail = session.user.email.trim().toLowerCase();
  if (!sessionEmail) {
    return { ok: false, error: "Your account does not have a valid email." };
  }

  const blocked = requireEventsDb();
  if (blocked) return blocked;

  const parsed = rsvpFields.safeParse({
    eventId: formData.get("eventId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: sessionEmail,
    year: formData.get("year"),
    branch: formData.get("branch"),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  const email = parsed.data.email.toLowerCase();

  if (
    !rateLimit(`rsvp:${ip}`, 8, 60_000) ||
    !rateLimit(`rsvp-email:${email}`, 3, 60_000)
  ) {
    return { ok: false, error: "Too many RSVP attempts. Try again in a minute." };
  }

  try {
    const db = getDb()!;
    const eventKey = parsed.data.eventId;
    let [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventKey))
      .limit(1);
    if (!event) {
      [event] = await db
        .select()
        .from(events)
        .where(eq(events.slug, eventKey))
        .limit(1);
    }

    if (!event || event.status !== "published") {
      return { ok: false, error: "This event is not open for RSVP." };
    }

    const now = new Date();
    if (event.endsAt <= now) {
      return { ok: false, error: "This event has ended." };
    }
    if (event.rsvpDeadline && event.rsvpDeadline <= now) {
      return { ok: false, error: "The RSVP deadline has passed." };
    }

    if (event.capacity != null) {
      const registered = await db
        .select({ id: eventRegistrations.id })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.status, "registered"),
          ),
        );
      if (registered.length >= event.capacity) {
        return { ok: false, error: "This event is at capacity." };
      }
    }

    const [existing] = await db
      .select()
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, event.id),
          eq(eventRegistrations.email, email),
        ),
      )
      .limit(1);

    // Already registered — treat as success so a prior email failure doesn't
    // look like a broken RSVP on retry.
    if (existing && existing.status !== "cancelled") {
      revalidatePath(`/events/${event.slug}`);
      revalidatePath("/account");
      revalidatePath(`/account/tickets/${existing.id}`);
      return {
        ok: true,
        ticketId: existing.id,
        ticketCode: existing.ticketCode ?? undefined,
      };
    }

    const ticketCode =
      existing?.ticketCode && existing.status === "cancelled"
        ? existing.ticketCode
        : createTicketCode();

    const payload = {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email,
      year: parsed.data.year,
      branch: parsed.data.branch,
      userId: session.user.id,
      status: "registered" as const,
      ticketCode,
      checkedInAt: null as Date | null,
    };

    let registrationId = existing?.id;

    if (existing) {
      await db
        .update(eventRegistrations)
        .set(payload)
        .where(eq(eventRegistrations.id, existing.id));
    } else {
      registrationId = crypto.randomUUID();
      await db.insert(eventRegistrations).values({
        id: registrationId,
        eventId: event.id,
        ...payload,
        createdAt: new Date(),
      });
    }

    const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.databiz.in"}/account/tickets/${registrationId}`;

    try {
      await sendTransactionalEmail({
        to: email,
        subject: `RSVP confirmed · ${event.title}`,
        html: `
          <p>Hi ${parsed.data.firstName},</p>
          <p>You are registered for <strong>${event.title}</strong>.</p>
          <p>Your door ticket code is <strong>${ticketCode}</strong>. Show the virtual ID at entry:</p>
          <p><a href="${ticketUrl}">${ticketUrl}</a></p>
          <p>We will email a reminder the day before. See the event page for venue and timing.</p>
        `,
      });
    } catch (mailError) {
      console.error("[rsvp] confirmation email failed", mailError);
    }

    revalidatePath(`/events/${event.slug}`);
    revalidatePath("/account");
    revalidatePath(`/account/tickets/${registrationId}`);
    revalidatePath(`/admin/events/${event.id}`);

    return {
      ok: true,
      ticketId: registrationId,
      ticketCode,
    };
  } catch (error) {
    console.error("[rsvp] registerForEvent failed", error);
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not save your RSVP.",
    };
  }
}

export async function setRegistrationStatus(
  registrationId: string,
  status: "registered" | "attended" | "cancelled",
): Promise<ActionResult> {
  await requireAdmin();
  const blocked = requireEventsDb();
  if (blocked) return blocked;

  const db = getDb()!;
  const [row] = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.id, registrationId))
    .limit(1);

  if (!row) return { ok: false, error: "Registration not found." };

  await db
    .update(eventRegistrations)
    .set({
      status,
      checkedInAt:
        status === "attended"
          ? row.checkedInAt ?? new Date()
          : status === "registered"
            ? null
            : row.checkedInAt,
    })
    .where(eq(eventRegistrations.id, registrationId));

  const [event] = await db
    .select({ slug: events.slug, id: events.id })
    .from(events)
    .where(eq(events.id, row.eventId))
    .limit(1);

  if (event) {
    revalidatePath(`/events/${event.slug}`);
    revalidatePath(`/admin/events/${event.id}`);
    revalidatePath(`/admin/events/${event.id}/check-in`);
  }

  return { ok: true };
}

export type CheckInResult =
  | {
      ok: true;
      alreadyCheckedIn: boolean;
      name: string;
      email: string;
      ticketCode: string;
      eventTitle: string;
      checkedInAt: string;
    }
  | { ok: false; error: string };

export async function checkInByTicketCode(
  rawCode: string,
  eventId?: string,
): Promise<CheckInResult> {
  await requireDesk();
  const blocked = requireEventsDb();
  if (blocked) return { ok: false, error: blocked.error || "Database not ready." };

  const ticketCode = parseTicketCode(rawCode);
  if (!ticketCode) {
    return {
      ok: false,
      error: "That does not look like a DataBiz ticket code.",
    };
  }

  const db = getDb()!;
  const [row] = await db
    .select({
      id: eventRegistrations.id,
      eventId: eventRegistrations.eventId,
      firstName: eventRegistrations.firstName,
      lastName: eventRegistrations.lastName,
      email: eventRegistrations.email,
      status: eventRegistrations.status,
      ticketCode: eventRegistrations.ticketCode,
      checkedInAt: eventRegistrations.checkedInAt,
      eventTitle: events.title,
      eventSlug: events.slug,
    })
    .from(eventRegistrations)
    .innerJoin(events, eq(eventRegistrations.eventId, events.id))
    .where(eq(eventRegistrations.ticketCode, ticketCode))
    .limit(1);

  if (!row || !row.ticketCode) {
    return { ok: false, error: "No registration found for that ticket." };
  }

  if (eventId && row.eventId !== eventId) {
    return {
      ok: false,
      error: `This ticket is for “${row.eventTitle}”, not this event.`,
    };
  }

  if (row.status === "cancelled") {
    return { ok: false, error: "This registration was cancelled." };
  }

  if (row.status === "attended" && row.checkedInAt) {
    return {
      ok: true,
      alreadyCheckedIn: true,
      name: `${row.firstName} ${row.lastName}`,
      email: row.email,
      ticketCode: row.ticketCode,
      eventTitle: row.eventTitle,
      checkedInAt: row.checkedInAt.toISOString(),
    };
  }

  const checkedInAt = new Date();
  await db
    .update(eventRegistrations)
    .set({ status: "attended", checkedInAt })
    .where(eq(eventRegistrations.id, row.id));

  revalidatePath(`/events/${row.eventSlug}`);
  revalidatePath(`/admin/events/${row.eventId}`);
  revalidatePath(`/admin/events/${row.eventId}/check-in`);
  revalidatePath(`/account/tickets/${row.id}`);
  revalidatePath("/account");

  return {
    ok: true,
    alreadyCheckedIn: false,
    name: `${row.firstName} ${row.lastName}`,
    email: row.email,
    ticketCode: row.ticketCode,
    eventTitle: row.eventTitle,
    checkedInAt: checkedInAt.toISOString(),
  };
}
