import { requireSaasAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";

export default async function SaasAdminMembersPage() {
  await requireSaasAdmin();

  const organizations = await prisma.organization.findMany({
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true, clerkUserId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const allMembers = organizations.flatMap(org =>
    org.users.map(u => ({ ...u, orgName: org.name, orgPlan: org.plan }))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={18} style={{ color: "#6366f1" }} /> All Members — Platform Wide
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {allMembers.length} total member{allMembers.length !== 1 ? "s" : ""} across {organizations.length} organization{organizations.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Per-Organization breakdown */}
      {organizations.map(org => (
        <div key={org.id} className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 10, background: "var(--bg-page)" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{org.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{org.id}</div>
            </div>
            <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: org.plan === "ENTERPRISE" ? "#fef3c7" : org.plan === "PRO" ? "#ede9fe" : "#cffafe", color: org.plan === "ENTERPRISE" ? "#d97706" : org.plan === "PRO" ? "#6366f1" : "#0891b2" }}>
              {org.plan}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>{org.users.length} member{org.users.length !== 1 ? "s" : ""}</span>
          </div>

          {org.users.length === 0 ? (
            <div style={{ padding: "20px 24px", fontSize: 13, color: "var(--text-muted)" }}>No members in this organization yet.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Name</th>
                  <th>Email (Gmail/Account)</th>
                  <th>Role</th>
                  <th>Clerk User ID</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {org.users.map((u, i) => (
                  <tr key={u.id}>
                    <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>
                      <a href={`mailto:${u.email}`} style={{ color: "#6366f1", fontSize: 13, textDecoration: "none" }}>
                        {u.email ?? "—"}
                      </a>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: u.role === "ADMIN" ? "#ede9fe" : u.role === "PLANT_MANAGER" ? "#fef3c7" : "#dcfce7", color: u.role === "ADMIN" ? "#6366f1" : u.role === "PLANT_MANAGER" ? "#d97706" : "#15803d" }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>{u.clerkUserId}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
