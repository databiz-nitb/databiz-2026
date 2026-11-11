import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-guard";
import { Suspense } from "react";
import { connection } from "next/server";
import { desc } from "drizzle-orm";
import { Container } from "@/components/ui/Container";
import { UserRoleSelect } from "@/components/admin/UserRoleSelect";
import { DataExportPrint } from "@/components/admin/DataExportPrint";
import { getDb, isDatabaseConfigured } from "@/db";
import { user } from "@/db/schema";
import { isRole, type Role } from "@/lib/roles";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Users" };

async function UsersTable() {
  await connection();

  if (!isDatabaseConfigured()) {
    return (
      <p className="mt-8 text-sm text-mute">
        Connect Neon to list accounts and roles.
      </p>
    );
  }

  const db = getDb()!;
  const rows = await db.select().from(user).orderBy(desc(user.createdAt));

  if (rows.length === 0) {
    return <p className="mt-8 text-sm text-mute">No users yet.</p>;
  }

  const exportRows = rows.map((row) => ({
    name: row.name,
    email: row.email,
    rollNumber: row.rollNumber ?? "",
    year: row.year ?? "",
    branch: row.branch ?? "",
    phone: row.phone ?? "",
    role: isRole(row.role) ? row.role : "applicant",
    joined: formatDateTime(row.createdAt.toISOString()),
  }));

  return (
    <>
      <div className="mt-8">
        <DataExportPrint
          title="DataBiz user directory"
          fileName="databiz-users"
          rows={exportRows}
          fields={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "rollNumber", label: "Roll" },
            { key: "year", label: "Year" },
            { key: "branch", label: "Branch" },
            { key: "phone", label: "Phone" },
            { key: "role", label: "Role" },
            { key: "joined", label: "Joined" },
          ]}
        />
      </div>
      <div className="mt-10 overflow-x-auto border border-line">
        <table className="w-full min-w-[64rem] text-left text-sm">
          <thead className="border-b border-line bg-paper-elevated font-mono text-[0.65rem] uppercase tracking-[0.14em] text-mute">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Roll</th>
              <th className="px-3 py-2 font-medium">Year</th>
              <th className="px-3 py-2 font-medium">Branch</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => {
              const role: Role = isRole(row.role) ? row.role : "applicant";
              return (
                <tr key={row.id}>
                  <td className="px-3 py-3 font-medium text-ink">{row.name}</td>
                  <td className="px-3 py-3">{row.email}</td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {row.rollNumber ?? "—"}
                  </td>
                  <td className="px-3 py-3">{row.year ?? "—"}</td>
                  <td className="px-3 py-3">{row.branch ?? "—"}</td>
                  <td className="px-3 py-3">
                    {row.phone ? (
                      <a className="hover:text-ember" href={`tel:${row.phone}`}>
                        {row.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <UserRoleSelect userId={row.id} role={role} />
                  </td>
                  <td className="px-3 py-3 text-mute">
                    {formatDateTime(row.createdAt.toISOString())}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

async function AdminUsersContent() {
  await requireAdminPage();
  return (
    <Container className="py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Users
      </h1>
      <p className="mt-3 max-w-xl text-mute">
        Promote applicants to member, interviewer, or admin. Changes apply on
        the next request.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-mute">Loading users…</p>}>
        <UsersTable />
      </Suspense>
    </Container>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-12">
          <p className="text-sm text-mute">Loading users…</p>
        </Container>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}
