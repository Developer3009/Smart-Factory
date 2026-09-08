import { prisma } from "@/lib/prisma";

export default async function PurchasePage() {
  let orders: any[] = [];
  try { orders = await prisma.purchaseOrder.findMany({ include: { vendor: true }, orderBy: { createdAt: "desc" } }); } catch {}

  const statusMap: Record<string, string> = { PENDING: "badge badge-yellow", APPROVED: "badge badge-cyan", RECEIVED: "badge badge-green", CANCELLED: "badge badge-red" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>Vendor</th><th>Amount</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No purchase orders yet.</td></tr>
            ) : (
              orders.map((o, i) => (
                <tr key={o.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{o.vendor?.name ?? "—"}</td>
                  <td>${o.amount.toFixed(2)}</td>
                  <td><span className={statusMap[o.status] ?? "badge badge-gray"}>{o.status}</span></td>
                  <td style={{ color: "var(--text-secondary)" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
