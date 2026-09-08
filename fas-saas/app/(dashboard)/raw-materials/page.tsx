import { prisma } from "@/lib/prisma";

export default async function RawMaterialsPage() {
  let items: any[] = [];
  try { items = await prisma.inventoryItem.findMany({ where: { type: "RAW_MATERIAL" }, orderBy: { name: "asc" } }); } catch {}

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>Name</th><th>SKU</th><th>Qty On Hand</th><th>Reorder Point</th><th>Unit</th></tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No raw materials yet.</td></tr>
            ) : (
              items.map((item, i) => (
                <tr key={item.id}>
                  <td>{i + 1}</td><td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{item.sku}</td>
                  <td style={{ fontWeight: 600 }}>{item.quantityOnHand}</td>
                  <td>{item.reorderPoint}</td><td>{item.unit}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
