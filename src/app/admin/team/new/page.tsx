import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdminPage } from "@/lib/admin-guard";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { TeamEditorForm } from "@/components/admin/TeamEditorForm";
import { isTeamDbReady } from "@/lib/team";

export const metadata: Metadata = { title: "Admin · New team member" };

async function AdminNewTeamMemberContent() {
  await requireAdminPage();
  if (!isTeamDbReady()) redirect("/admin/team");
  return (
    <Container className="py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        New team member
      </h1>
      <div className="mt-10 max-w-xl">
        <TeamEditorForm />
      </div>
    </Container>
  );
}

export default function AdminNewTeamMemberPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-12">
          <p className="text-sm text-mute">Loading team editor…</p>
        </Container>
      }
    >
      <AdminNewTeamMemberContent />
    </Suspense>
  );
}
