"use client";

import { useState, useTransition } from "react";
import { Plus, Download, Search, Eye, Trash2, ChevronLeft, ChevronRight, Package, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { FormField, Select, FormGrid, FormActions, Textarea } from "@/components/ui/FormFields";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

interface BomRow { itemId: string; quantity: string; unit: string; }

export default function ProductsClient({ products, inventoryItems }: { products: any[]; inventoryItems: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [description, setDescription] = useState("");
  const [bomRows, setBomRows] = useState<BomRow[]>([{ itemId: "", quantity: "1", unit: "pcs" }]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetForm() {
    setName(""); setSku(""); setUnitPrice(""); setDescription("");
    setBomRows([{ itemId: "", quantity: "1", unit: "pcs" }]);
    setError("");
  }

  function addBomRow() { setBomRows(r => [...r, { itemId: "", quantity: "1", unit: "pcs" }]); }
  function removeBomRow(i: number) { setBomRows(r => r.filter((_, idx) => idx !== i)); }
  function updateBomRow(i: number, field: keyof BomRow, value: string) {
    setBomRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !sku) { setError("Name and SKU are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, sku,
          unitPrice: parseFloat(unitPrice) || 0,
          description,
          bomItems: bomRows.filter(r => r.itemId).map(r => ({
            itemId: r.itemId, quantity: parseFloat(r.quantity) || 1, unit: r.unit,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      resetForm(); setShowCreate(false);
      startTransition(() => router.refresh());
    } catch (err: any) {
      setError(err.message || "Failed to create product.");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Controls */}
      <div className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn-ghost"><Download size={14} /> EXPORT</button>
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="input" style={{ paddingLeft: 32, width: 220, fontSize: 13 }} placeholder="Search products..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button className="btn-icon" style={{ border: "1px solid var(--border-color)", borderRadius: 8, padding: 6 }}
          onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus size={18} />
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Unit Price</th>
              <th>BOM Items</th>
              <th>Description</th>
              <th style={{ width: 100 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No products found.</td></tr>
            ) : paginated.map((p, idx) => (
              <tr key={p.id}>
                <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Package size={14} style={{ color: "#7c3aed" }} />
                    </div>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{p.sku}</td>
                <td style={{ fontWeight: 600 }}>₹{p.unitPrice.toLocaleString()}</td>
                <td>
                  <span className="badge badge-cyan">{p.bomItems?.length ?? 0} items</span>
                </td>
                <td style={{ color: "var(--text-secondary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.description ?? "—"}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn-icon" title="View" onClick={() => setShowDetail(p)}><Eye size={15} style={{ color: "#06b6d4" }} /></button>
                    <button className="btn-icon" title="Delete" onClick={() => handleDelete(p.id)}><Trash2 size={15} style={{ color: "#ef4444" }} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "12px 16px", borderTop: "1px solid var(--border-color)" }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <button className="btn-icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ opacity: page === 1 ? 0.4 : 1 }}><ChevronLeft size={16} /></button>
          <button className="btn-icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ opacity: page === totalPages ? 0.4 : 1 }}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Create Product Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Product" width={600}>
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <FormGrid>
            <FormField label="Product Name" required>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Steel Shaft 50mm" />
            </FormField>
            <FormField label="SKU" required>
              <input className="input" value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. SS-50MM" />
            </FormField>
          </FormGrid>
          <FormGrid>
            <FormField label="Unit Price (₹)">
              <input className="input" type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="0.00" />
            </FormField>
          </FormGrid>
          <FormField label="Description">
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description..." rows={2} />
          </FormField>

          {/* BOM Section */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Bill of Materials</label>
              <button type="button" className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={addBomRow}>
                <Plus size={13} /> Add Item
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {bomRows.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 32px", gap: 8, alignItems: "center" }}>
                  <Select value={row.itemId} onChange={e => updateBomRow(i, "itemId", e.target.value)}>
                    <option value="">Select material...</option>
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                    ))}
                  </Select>
                  <input className="input" type="number" min="0.01" step="any" value={row.quantity}
                    onChange={e => updateBomRow(i, "quantity", e.target.value)} placeholder="Qty" style={{ fontSize: 13 }} />
                  <input className="input" value={row.unit}
                    onChange={e => updateBomRow(i, "unit", e.target.value)} placeholder="Unit" style={{ fontSize: 13 }} />
                  <button type="button" className="btn-icon" onClick={() => removeBomRow(i)} style={{ color: "#ef4444" }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}
          <FormActions>
            <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Create Product"}</button>
          </FormActions>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail?.name ?? ""} width={560}>
        {showDetail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["SKU", showDetail.sku], ["Unit Price", `₹${showDetail.unitPrice.toLocaleString()}`], ["Description", showDetail.description ?? "—"]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
            {showDetail.bomItems?.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>Bill of Materials</div>
                <table className="data-table">
                  <thead><tr><th>Material</th><th>SKU</th><th>Qty</th><th>Unit</th></tr></thead>
                  <tbody>
                    {showDetail.bomItems.map((b: any) => (
                      <tr key={b.id}>
                        <td>{b.item?.name}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{b.item?.sku}</td>
                        <td style={{ fontWeight: 600 }}>{b.quantity}</td>
                        <td>{b.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
