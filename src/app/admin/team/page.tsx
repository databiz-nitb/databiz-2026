import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdminPage } from "@/lib/admin-guard";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { isTeamDbReady, listAdminTeam } from "@/lib/team";

export const metadata: Metadata = { title: "Admin · Team" };

async function AdminTeamContent() {
  await requireAdminPage();
  const dbReady = isTeamDbReady();
  const rows = dbReady ? await listAdminTeam() : [];

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Team
          </h1>
          <p className="mt-2 max-w-xl text-mute">
            Core roster on `/team`. Photos upload to Cloudinary avatars.
          </p>
        </div>
        {dbReady ? (
          <Button href="/admin/team/new" variant="ember">
            Add member
          </Button>
        ) : null}
      </div>

      {!dbReady ? (
        <p className="mt-8 text-sm text-mute">Connect Neon to manage the team.</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-mute">No team members yet.</p>
      ) : (
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/team/${row.id}`}
                className="grid gap-1 py-5 transition-colors hover:bg-paper-elevated sm:grid-cols-[1fr_10rem_6rem] sm:items-center sm:gap-4"
              >
                <div>
                  <p className="font-medium text-ink">{row.name}</p>
                  <p className="mt-1 text-sm text-mute">{row.roleTitle}</p>
                </div>
                <p className="font-mono text-xs text-mute">
                  {row.yearLabel || "—"}
                </p>
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
                  {row.isCurrent ? "Current" : "Past"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

export default function AdminTeamPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-12">
          <p className="text-sm text-mute">Loading team…</p>
        </Container>
      }
    >
      <AdminTeamContent />
    </Suspense>
  );
}
