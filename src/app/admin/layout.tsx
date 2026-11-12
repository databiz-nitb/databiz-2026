import { Suspense } from "react";
import { connection } from "next/server";
import { requireDesk } from "@/lib/session";
import { canAccessAdmin, canPublish } from "@/lib/roles";
import { AdminNav } from "@/components/admin/AdminNav";
import { DeskProvider } from "@/components/admin/DeskContext";
import { AdminShellSkeleton } from "@/components/ui/PageLoader";

export const instant = false;

async function AdminShell({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await requireDesk();
  const role = session.user.role;
  const caps = {
    role,
    canPublish: canPublish(role),
    isAdmin: canAccessAdmin(role),
  };

  return (
    <DeskProvider value={caps}>
      <div className="min-h-full bg-paper lg:flex">
        <AdminNav
          email={session.user.email}
          role={role}
          isAdmin={caps.isAdmin}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </DeskProvider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
