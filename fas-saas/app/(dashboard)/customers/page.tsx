import { prisma } from "@/lib/prisma";
import { requireOrgAdmin } from "@/lib/auth";

export default async function CustomersPage() {
  const { orgId } = await requireOrgAdmin();
  let customers: any[] = [];
  try { customers = await prisma.customer.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }); } catch {}

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Created</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No customers yet.</td></tr>
            ) : (
              customers.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{c.email ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{c.phone ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
