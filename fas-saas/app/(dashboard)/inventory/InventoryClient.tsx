"use client";

import { useState, useTransition } from "react";
import { Download, Plus, Search, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { FormField, Select, FormGrid, FormActions } from "@/components/ui/FormFields";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

export default function InventoryClient({ items }: { items: any[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("RAW_MATERIAL");
  const [qty, setQty] = useState("0");
  const [reorder, setReorder] = useState("0");
  const [unit, setUnit] = useState("pcs");
  const [unitCost, setUnitCost] = useState("0");

  function resetForm() { setSku(""); setName(""); setType("RAW_MATERIAL"); setQty("0"); setReorder("0"); setUnit("pcs"); setUnitCost("0"); setError(""); }

  const filtered = items.filter(i =>
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())) &&
    (!typeFilter || i.type === typeFilter)
  );
  const lowStock = items.filter(i => i.quantityOnHand <= i.reorderPoint);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!sku || !name) { setError("SKU and Name are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, name, type, quantityOnHand: qty, reorderPoint: reorder, unit, unitCost }),
      });
      if (!res.ok) throw new Error(await res.text());
      resetForm(); setShowCreate(false);
      startTransition(() => router.refresh());
    } catch (err: any) { setError(err.message || "Failed."); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#92400e" }}>
          <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <strong>{lowStock.length} item{lowStock.length > 1 ? "s" : ""} below reorder point:</strong>
          {lowStock.slice(0, 3).map(i => i.name).join(", ")}{lowStock.length > 3 && ` +${lowStock.length - 3} more`}
        </div>
      )}

      {/* Controls */}
      <div className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button className="btn-ghost"><Download size={14} /> EXPORT</button>
        <div style={{ display: "flex", gap: 6 }}>
          {["", "RAW_MATERIAL", "FINISHED_GOOD", "WIP"].map(t => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
              style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", border: "1px solid var(--border-color)", background: typeFilter === t ? "#6366f1" : "var(--bg-card)", color: typeFilter === t ? "white" : "var(--text-secondary)" }}>
              {t === "" ? "All" : t === "RAW_MATERIAL" ? "Raw" : t === "FINISHED_GOOD" ? "Finished" : "WIP"}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="input" style={{ paddingLeft: 32, width: 220, fontSize: 13 }} placeholder="Search inventory..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button className="btn-icon" style={{ border: "1px solid var(--border-color)", borderRadius: 8, padding: 6 }} onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus size={18} />
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>Item Name</th>
                <th>SKU</th>
                <th>Type</th>
                <th>Qty On Hand</th>
                <th>Reorder Point</th>
                <th>Unit</th>
                <th>Unit Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No inventory items found.</td></tr>
              ) : paginated.map((item, idx) => {
                const isLow = item.quantityOnHand <= item.reorderPoint;
                return (
                  <tr key={item.id}>
                    <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{item.sku}</td>
                    <td>
                      <span className={`badge ${item.type === "RAW_MATERIAL" ? "badge-cyan" : item.type === "FINISHED_GOOD" ? "badge-green" : "badge-yellow"}`}>
                        {item.type === "RAW_MATERIAL" ? "Raw Material" : item.type === "FINISHED_GOOD" ? "Finished Good" : "WIP"}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: isLow ? "#ef4444" : "var(--text-primary)" }}>{item.quantityOnHand}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{item.reorderPoint}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{item.unit}</td>
                    <td style={{ color: "var(--text-secondary)" }}>₹{item.unitCost.toLocaleString()}</td>
                    <td>
                      {isLow
                        ? <span className="badge badge-red" style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><AlertTriangle size={11} /> REORDER</span>
                        : <span className="badge badge-green">OK</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "12px 16px", borderTop: "1px solid var(--border-color)" }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <button className="btn-icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ opacity: page === 1 ? 0.4 : 1 }}><ChevronLeft size={16} /></button>
          <button className="btn-icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ opacity: page === totalPages ? 0.4 : 1 }}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Inventory Item">
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FormGrid>
            <FormField label="Item Name" required>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Steel Rod 25mm" />
            </FormField>
            <FormField label="SKU" required>
              <input className="input" value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. RM-STEEL-001" />
            </FormField>
          </FormGrid>
          <FormGrid>
            <FormField label="Type">
              <Select value={type} onChange={e => setType(e.target.value)}>
                <option value="RAW_MATERIAL">Raw Material</option>
                <option value="FINISHED_GOOD">Finished Good</option>
                <option value="WIP">Work-in-Progress</option>
              </Select>
            </FormField>
            <FormField label="Unit">
              <input className="input" value={unit} onChange={e => setUnit(e.target.value)} placeholder="pcs, kg, L..." />
            </FormField>
          </FormGrid>
          <FormGrid>
            <FormField label="Qty on Hand">
              <input className="input" type="number" min="0" step="any" value={qty} onChange={e => setQty(e.target.value)} />
            </FormField>
            <FormField label="Reorder Point">
              <input className="input" type="number" min="0" step="any" value={reorder} onChange={e => setReorder(e.target.value)} />
            </FormField>
          </FormGrid>
          <FormField label="Unit Cost (₹)">
            <input className="input" type="number" min="0" step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} />
          </FormField>
          {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}
          <FormActions>
            <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Add Item"}</button>
          </FormActions>
        </form>
      </Modal>
    </div>
  );
}
