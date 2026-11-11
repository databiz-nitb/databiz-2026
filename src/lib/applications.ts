import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/db";
import { user } from "@/db/schema";
import {
  applications,
  driveRoles,
  interviewAssignments,
  interviewBookings,
  interviewSlots,
  oaAttempts,
  oaQuestions,
} from "@/db/schema/hiring";
import { drives } from "@/db/schema/content";
import { canAccessAdmin, hasMinRole, type Role } from "@/lib/roles";

export const APPLICATION_STAGES = [
  "applied",
  "oa",
  "shortlisted",
  "interview",
  "selected",
  "waitlisted",
  "rejected",
  "accepted",
  "declined",
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export type ApplicationSummary = {
  id: string;
  stage: ApplicationStage;
  portfolioUrl?: string;
  resumePublicId: string;
  createdAt: string;
  resultsPublishedAt?: string | null;
  drive: { id: string; slug: string; title: string; status: string };
  role: {
    id: string;
    name: string;
    oaMode: string;
    oaDeadline?: string;
    liveStartsAt?: string;
    liveEndsAt?: string;
    quizMinutes?: number | null;
  };
  attempt?: {
    id: string;
    status: string;
    startedAt: string;
    submittedAt?: string | null;
    autoScore?: number | null;
    manualScore?: number | null;
  } | null;
  booking?: {
    id: string;
    startsAt: string;
    endsAt: string;
  } | null;
};

export function isApplicationsDbReady() {
  return isDatabaseConfigured();
}

export function canRunInterviews(role: Role | null | undefined) {
  return Boolean(role && (canAccessAdmin(role) || role === "interviewer"));
}

export function applicantVisibleStage(
  stage: ApplicationStage,
  resultsPublishedAt: string | null | undefined,
): ApplicationStage {
  if (
    (stage === "selected" || stage === "waitlisted" || stage === "rejected") &&
    !resultsPublishedAt
  ) {
    return "interview";
  }
  return stage;
}

export async function getApplicationForUser(
  userId: string,
  driveId?: string,
): Promise<ApplicationSummary | null> {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select({
      application: applications,
      drive: drives,
      role: driveRoles,
    })
    .from(applications)
    .innerJoin(drives, eq(applications.driveId, drives.id))
    .innerJoin(driveRoles, eq(applications.roleId, driveRoles.id))
    .where(
      driveId
        ? and(eq(applications.userId, userId), eq(applications.driveId, driveId))
        : eq(applications.userId, userId),
    )
    .orderBy(desc(applications.createdAt))
    .limit(1);

  if (rows.length === 0) return null;
  return hydrateSummary(rows[0]!);
}

export async function listApplicationsForUser(
  userId: string,
): Promise<ApplicationSummary[]> {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select({
      application: applications,
      drive: drives,
      role: driveRoles,
    })
    .from(applications)
    .innerJoin(drives, eq(applications.driveId, drives.id))
    .innerJoin(driveRoles, eq(applications.roleId, driveRoles.id))
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt));

  return Promise.all(rows.map((row) => hydrateSummary(row)));
}

export async function listDriveApplications(
  driveId: string,
): Promise<
  (ApplicationSummary & {
    user: { id: string; name: string; email: string; rollNumber?: string | null; year?: string | null; branch?: string | null };
  })[]
> {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select({
      application: applications,
      drive: drives,
      role: driveRoles,
      user,
    })
    .from(applications)
    .innerJoin(drives, eq(applications.driveId, drives.id))
    .innerJoin(driveRoles, eq(applications.roleId, driveRoles.id))
    .innerJoin(user, eq(applications.userId, user.id))
    .where(eq(applications.driveId, driveId))
    .orderBy(asc(driveRoles.sortOrder), desc(applications.createdAt));

  const summaries = await Promise.all(
    rows.map(async (row) => ({
      ...(await hydrateSummary(row)),
      user: {
        id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        rollNumber: row.user.rollNumber,
        year: row.user.year,
        branch: row.user.branch,
      },
    })),
  );
  return summaries;
}

async function hydrateSummary(row: {
  application: typeof applications.$inferSelect;
  drive: typeof drives.$inferSelect;
  role: typeof driveRoles.$inferSelect;
}): Promise<ApplicationSummary> {
  const db = getDb()!;
  const [attempt] = await db
    .select()
    .from(oaAttempts)
    .where(eq(oaAttempts.applicationId, row.application.id))
    .limit(1);

  const [bookingRow] = await db
    .select({
      id: interviewBookings.id,
      startsAt: interviewSlots.startsAt,
      endsAt: interviewSlots.endsAt,
    })
    .from(interviewBookings)
    .innerJoin(interviewSlots, eq(interviewBookings.slotId, interviewSlots.id))
    .where(eq(interviewBookings.applicationId, row.application.id))
    .limit(1);

  return {
    id: row.application.id,
    stage: row.application.stage as ApplicationStage,
    portfolioUrl: row.application.portfolioUrl ?? undefined,
    resumePublicId: row.application.resumePublicId,
    createdAt: row.application.createdAt.toISOString(),
    resultsPublishedAt:
      row.application.resultsPublishedAt?.toISOString() ??
      row.drive.resultsPublishedAt?.toISOString() ??
      null,
    drive: {
      id: row.drive.id,
      slug: row.drive.slug,
      title: row.drive.title,
      status: row.drive.status,
    },
    role: {
      id: row.role.id,
      name: row.role.name,
      oaMode: row.role.oaMode,
      oaDeadline: row.role.oaDeadline?.toISOString(),
      liveStartsAt: row.role.liveStartsAt?.toISOString(),
      liveEndsAt: row.role.liveEndsAt?.toISOString(),
      quizMinutes: row.role.quizMinutes,
    },
    attempt: attempt
      ? {
          id: attempt.id,
          status: attempt.status,
          startedAt: attempt.startedAt.toISOString(),
          submittedAt: attempt.submittedAt?.toISOString() ?? null,
          autoScore: attempt.autoScore,
          manualScore: attempt.manualScore,
        }
      : null,
    booking: bookingRow
      ? {
          id: bookingRow.id,
          startsAt: bookingRow.startsAt.toISOString(),
          endsAt: bookingRow.endsAt.toISOString(),
        }
      : null,
  };
}

export type PublicQuestion = {
  id: string;
  prompt: string;
  kind: "multiple_choice" | "short_text" | "long_text";
  options: string[];
  points: number;
};

export async function listPublicQuestionsForRole(
  roleId: string,
): Promise<PublicQuestion[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: oaQuestions.id,
      prompt: oaQuestions.prompt,
      kind: oaQuestions.kind,
      options: oaQuestions.options,
      points: oaQuestions.points,
    })
    .from(oaQuestions)
    .where(eq(oaQuestions.roleId, roleId))
    .orderBy(asc(oaQuestions.sortOrder));

  return rows.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    kind: (row.kind as PublicQuestion["kind"]) || "short_text",
    options: row.options ?? [],
    points: row.points,
  }));
}

export async function listAdminQuestionsForRole(roleId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(oaQuestions)
    .where(eq(oaQuestions.roleId, roleId))
    .orderBy(asc(oaQuestions.sortOrder));
}

export async function listSlotsForDrive(driveId: string) {
  const db = getDb();
  if (!db) return [];
  const slots = await db
    .select()
    .from(interviewSlots)
    .where(eq(interviewSlots.driveId, driveId))
    .orderBy(asc(interviewSlots.startsAt));

  if (slots.length === 0) return [];

  const bookings = await db
    .select()
    .from(interviewBookings)
    .where(inArray(interviewBookings.slotId, slots.map((s) => s.id)));

  return slots.map((slot) => {
    const taken = bookings.filter((b) => b.slotId === slot.id).length;
    return {
      id: slot.id,
      startsAt: slot.startsAt.toISOString(),
      endsAt: slot.endsAt.toISOString(),
      capacity: slot.capacity,
      booked: taken,
      remaining: Math.max(0, slot.capacity - taken),
    };
  });
}

export async function listAssignedApplications(interviewerId: string) {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select({
      application: applications,
      drive: drives,
      role: driveRoles,
      applicant: user,
    })
    .from(interviewAssignments)
    .innerJoin(
      applications,
      eq(interviewAssignments.applicationId, applications.id),
    )
    .innerJoin(drives, eq(applications.driveId, drives.id))
    .innerJoin(driveRoles, eq(applications.roleId, driveRoles.id))
    .innerJoin(user, eq(applications.userId, user.id))
    .where(eq(interviewAssignments.interviewerId, interviewerId))
    .orderBy(desc(applications.updatedAt));

  return rows.map((row) => ({
    applicationId: row.application.id,
    stage: row.application.stage as ApplicationStage,
    driveTitle: row.drive.title,
    roleName: row.role.name,
    applicant: {
      id: row.applicant.id,
      name: row.applicant.name,
      email: row.applicant.email,
      rollNumber: row.applicant.rollNumber,
      year: row.applicant.year,
      branch: row.applicant.branch,
      phone: row.applicant.phone,
    },
  }));
}

export function requireMemberProfile(input: {
  name?: string | null;
  year?: string | null;
  branch?: string | null;
}) {
  if (!input.name?.trim()) return "Name is required before applying.";
  if (!input.year?.trim()) return "Year is required before applying.";
  if (!input.branch?.trim()) return "Branch is required before applying.";
  return null;
}

export function canTakeOa(stage: ApplicationStage) {
  return stage === "oa";
}

export function canBookInterview(stage: ApplicationStage) {
  return stage === "shortlisted" || stage === "interview";
}

/** Interviewer role check helper used by pages. */
export function isStaff(role: Role | null | undefined) {
  return Boolean(role && hasMinRole(role, "interviewer"));
}
