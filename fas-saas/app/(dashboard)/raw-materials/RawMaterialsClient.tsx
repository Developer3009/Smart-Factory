"use client";

import { useState } from "react";
import { Layers, Plus, Trash2, X, AlertTriangle } from "lucide-react";

interface RawMaterial { id: string; name: string; sku: string; quantityOnHand: number; reorderPoint: number; unit: string; unitCost: number; createdAt: Date | string; }

export default function RawMaterialsClient({ items: initial, orgId }: { items: RawMaterial[]; orgId: string }) {
  const [items, setItems] = useState<RawMaterial[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", sku: "", quantityOnHand: "", reorderPoint: "", unit: "pcs", unitCost: "" });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!form.name.trim() || !form.sku.trim()) { setError("Name and SKU are required."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/raw-materials", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, sku: form.sku, unit: form.unit,
          quantityOnHand: parseFloat(form.quantityOnHand) || 0,
          reorderPoint: parseFloat(form.reorderPoint) || 0,
          unitCost: parseFloat(form.unitCost) || 0,
          organizationId: orgId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setItems(prev => [data, ...prev]);
      setForm({ name: "", sku: "", quantityOnHand: "", reorderPoint: "", unit: "pcs", unitCost: "" });
      setShowForm(false);
    } catch { setError("Network error."); } finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this raw material?")) return;
    const res = await fetch(`/api/raw-materials/${id}`, { method: "DELETE" });
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Raw Materials</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{items.length} item{items.length !== 1 ? "s" : ""} in stock</div>
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }} onClick={() => { setShowForm(true); setError(""); }}>
          <Plus size={15} /> Add Raw Material
        </button>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: 480, padding: 28, position: "relative" }}>
            <button onClick={() => setShowForm(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#f59e0b,#f97316)", display: "flex", alignItems: "center", justifyContent: "center" }}><Layers size={18} color="white" /></div>
              <div><div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Add Raw Material</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Add a new raw material to your inventory</div></div>
            </div>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Material Name *</label><input className="input" placeholder="e.g. Steel Rod 10mm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>SKU Code *</label><input className="input" placeholder="e.g. RM-STL-010" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} required /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Qty On Hand</label><input className="input" type="number" step="0.01" placeholder="0" value={form.quantityOnHand} onChange={e => setForm(f => ({ ...f, quantityOnHand: e.target.value }))} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Reorder Point</label><input className="input" type="number" step="0.01" placeholder="0" value={form.reorderPoint} onChange={e => setForm(f => ({ ...f, reorderPoint: e.target.value }))} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Unit Cost (₹)</label><input className="input" type="number" step="0.01" placeholder="0.00" value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))} /></div>
              </div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Unit</label>
                <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                  <option value="pcs">Pieces (pcs)</option><option value="kg">Kilograms (kg)</option><option value="ltr">Liters (ltr)</option><option value="mtr">Meters (mtr)</option><option value="ton">Tons</option><option value="box">Boxes</option>
                </select>
              </div>
              {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{error}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}><button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>{loading ? "Adding…" : "Add Material"}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead><tr><th style={{ width: 48 }}>#</th><th>Material Name</th><th>SKU</th><th>Qty On Hand</th><th>Reorder Point</th><th>Unit</th><th>Unit Cost</th><th style={{ width: 60 }}>Actions</th></tr></thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>No raw materials yet. Click <strong>Add Raw Material</strong>.</td></tr>
            ) : items.map((item, i) => {
              const lowStock = item.quantityOnHand <= item.reorderPoint && item.reorderPoint > 0;
              return (
                <tr key={item.id}>
                  <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {item.name}
                      {lowStock && <AlertTriangle size={13} style={{ color: "#f59e0b" }} />}
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{item.sku}</td>
                  <td style={{ fontWeight: 600, color: lowStock ? "#ef4444" : "var(--text-primary)" }}>{item.quantityOnHand}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{item.reorderPoint}</td>
                  <td>{item.unit}</td>
                  <td style={{ color: "var(--text-secondary)" }}>₹{item.unitCost.toFixed(2)}</td>
                  <td><button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }} title="Delete"><Trash2 size={15} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
