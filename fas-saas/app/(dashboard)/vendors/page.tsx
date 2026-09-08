import { prisma } from "@/lib/prisma";

export default async function VendorsPage() {
  let vendors: any[] = [];
  try { vendors = await prisma.vendor.findMany({ orderBy: { createdAt: "desc" } }); } catch {}

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>Vendor Name</th><th>Email</th><th>Phone</th></tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No vendors yet.</td></tr>
            ) : (
              vendors.map((v, i) => (
                <tr key={v.id}><td>{i + 1}</td><td style={{ fontWeight: 500 }}>{v.name}</td><td>{v.email ?? "—"}</td><td>{v.phone ?? "—"}</td></tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
