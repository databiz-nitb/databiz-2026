import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const teamMembers = pgTable("team_members", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  roleTitle: text("role_title").notNull(),
  bio: text("bio").notNull().default(""),
  photoPublicId: text("photo_public_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  isCurrent: boolean("is_current").notNull().default(true),
  yearLabel: text("year_label"),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
});

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    body: text("body").notNull().default(""),
    posterPublicId: text("poster_public_id"),
    venue: text("venue"),
    meetingUrl: text("meeting_url"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    capacity: integer("capacity"),
    rsvpDeadline: timestamp("rsvp_deadline", { withTimezone: true }),
    status: text("status").notNull().default("draft"),
    recapBody: text("recap_body"),
    recordingUrl: text("recording_url"),
    template: text("template").notNull().default("default"),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("events_slug_uidx").on(t.slug)],
);

export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "restrict" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    year: text("year").notNull(),
    branch: text("branch").notNull(),
    status: text("status").notNull().default("registered"),
    /** Short unique code encoded in the virtual ID / QR for door check-in. */
    ticketCode: text("ticket_code").unique(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("event_reg_event_email_uidx").on(t.eventId, t.email)],
);

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    body: text("body").notNull().default(""),
    coverPublicId: text("cover_public_id"),
    authorName: text("author_name").notNull().default(""),
    authorId: text("author_id").references(() => teamMembers.id, {
      onDelete: "set null",
    }),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    status: text("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
    projectId: text("project_id"),
    episodeId: text("episode_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("posts_slug_uidx").on(t.slug)],
);

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    body: text("body").notNull().default(""),
    coverPublicId: text("cover_public_id"),
    year: integer("year").notNull(),
    links: jsonb("links")
      .$type<{ label: string; url: string }[]>()
      .notNull()
      .default([]),
    status: text("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("projects_slug_uidx").on(t.slug)],
);

export const episodes = pgTable(
  "episodes",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    showNotes: text("show_notes").notNull().default(""),
    coverPublicId: text("cover_public_id"),
    status: text("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    provider: text("provider").notNull().default("youtube"),
    embedUrl: text("embed_url"),
    externalUrl: text("external_url"),
    eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
  },
  (t) => [uniqueIndex("episodes_slug_uidx").on(t.slug)],
);

export const episodeGuests = pgTable("episode_guests", {
  id: text("id").primaryKey(),
  episodeId: text("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title").notNull().default(""),
  organization: text("organization").notNull().default(""),
  photoPublicId: text("photo_public_id"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const pathways = pgTable(
  "pathways",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    discipline: text("discipline").notNull().default("other"),
    status: text("status").notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("pathways_slug_uidx").on(t.slug)],
);

export const pathwayModules = pgTable("pathway_modules", {
  id: text("id").primaryKey(),
  pathwayId: text("pathway_id")
    .notNull()
    .references(() => pathways.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const pathwayProgress = pgTable(
  "pathway_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    moduleId: text("module_id")
      .notNull()
      .references(() => pathwayModules.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.moduleId] })],
);

export const drives = pgTable(
  "drives",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
    closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("draft"),
    resultsPublishedAt: timestamp("results_published_at", {
      withTimezone: true,
    }),
  },
  (t) => [uniqueIndex("drives_slug_uidx").on(t.slug)],
);

export const alumniProfiles = pgTable(
  "alumni_profiles",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    batch: integer("batch").notNull(),
    branch: text("branch").notNull().default(""),
    societyRole: text("society_role").notNull().default(""),
    currentTitle: text("current_title").notNull().default(""),
    organization: text("organization").notNull().default(""),
    linkedinUrl: text("linkedin_url"),
    photoPublicId: text("photo_public_id"),
    note: text("note"),
    status: text("status").notNull().default("pending"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("alumni_slug_uidx").on(t.slug)],
);

export const announcements = pgTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
  postId: text("post_id").references(() => posts.id, { onDelete: "set null" }),
  driveId: text("drive_id").references(() => drives.id, { onDelete: "set null" }),
  episodeId: text("episode_id").references(() => episodes.id, {
    onDelete: "set null",
  }),
});

export const sponsors = pgTable("sponsors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logoPublicId: text("logo_public_id"),
  url: text("url"),
  blurb: text("blurb"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const eventPhotos = pgTable("event_photos", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .references(() => events.id, { onDelete: "cascade" }),
  customEventName: text("custom_event_name"),
  publicId: text("public_id").notNull(),
  caption: text("caption").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const sitePages = pgTable("site_pages", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const faqItems = pgTable("faq_items", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
});

export const subscribers = pgTable(
  "subscribers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    status: text("status").notNull().default("pending"),
    confirmToken: text("confirm_token"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("subscribers_email_uidx").on(t.email)],
);

export const newsletterSends = pgTable("newsletter_sends", {
  id: text("id").primaryKey(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  recipientCount: integer("recipient_count").notNull().default(0),
  sourceType: text("source_type"),
  sourceId: text("source_id"),
  status: text("status").notNull().default("sent"),
  error: text("error"),
});

/** Member-composed newsletters waiting for admin send. */
export const newsletterDrafts = pgTable("newsletter_drafts", {
  id: text("id").primaryKey(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("pending"),
  createdByUserId: text("created_by_user_id"),
  createdByEmail: text("created_by_email"),
  sourceType: text("source_type"),
  sourceId: text("source_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const contactMessages = pgTable("contact_messages", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const redirects = pgTable(
  "redirects",
  {
    id: text("id").primaryKey(),
    fromPath: text("from_path").notNull(),
    toPath: text("to_path").notNull(),
  },
  (t) => [uniqueIndex("redirects_from_uidx").on(t.fromPath)],
);

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const resources = pgTable("resources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  url: text("url"),
  publicId: text("public_id"),
  sortOrder: integer("sort_order").notNull().default(0),
});
