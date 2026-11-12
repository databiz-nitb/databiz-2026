import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-guard";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { TeamEditorForm } from "@/components/admin/TeamEditorForm";
import { getAdminTeamMember, isTeamDbReady } from "@/lib/team";

type Props = { params: Promise<{ id: string }> };

export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const member = await getAdminTeamMember(id);
  return { title: member ? `Admin · ${member.name}` : "Admin · Team member" };
}

export default async function AdminTeamMemberPage({ params }: Props) {
  await requireAdminPage();
  if (!isTeamDbReady()) redirect("/admin/team");
  const { id } = await params;
  const member = await getAdminTeamMember(id);
  if (!member) notFound();

  return (
    <Container className="py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {member.name}
      </h1>
      <div className="mt-10 max-w-xl">
        <TeamEditorForm member={member} />
      </div>
    </Container>
  );
}
