"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, X, Search, Download, ChevronLeft, ChevronRight, ShoppingCart, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = ["PENDING", "APPROVED", "RECEIVED", "CANCELLED"];
const STATUS_BADGE: Record<string, string> = {
  PENDING:   "badge badge-yellow",
  APPROVED:  "badge badge-cyan",
  RECEIVED:  "badge badge-green",
  CANCELLED: "badge badge-red",
};

interface Vendor { id: string; name: string; email?: string | null; phone?: string | null; }
interface PurchaseOrder {
  id: string; vendorId: string; amount: number; status: string;
  notes?: string | null; expectedDelivery?: string | null;
  createdAt: Date | string; vendor?: Vendor | null;
}

export default function PurchaseClient({ orders: initial, vendors }: { orders: PurchaseOrder[]; vendors: Vendor[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [orders, setOrders] = useState<PurchaseOrder[]>(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ vendorId: vendors[0]?.id ?? "", amount: "", status: "PENDING", notes: "", expectedDelivery: "" });

  function resetForm() {
    setForm({ vendorId: vendors[0]?.id ?? "", amount: "", status: "PENDING", notes: "", expectedDelivery: "" });
    setError("");
  }

  const filtered = orders.filter(o => {
    const matchSearch = (o.vendor?.name ?? "").toLowerCase().includes(search.toLowerCase()) || o.status.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vendorId || !form.amount) { setError("Vendor and amount are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create"); return; }
      setOrders(prev => [data, ...prev]);
      setShowCreate(false); resetForm();
      startTransition(() => router.refresh());
    } catch { setError("Network error."); } finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      if (viewOrder?.id === id) setViewOrder(v => v ? { ...v, status } : v);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this purchase order?")) return;
    const res = await fetch(`/api/purchase-orders/${id}`, { method: "DELETE" });
    if (res.ok) {
      setOrders(prev => prev.filter(o => o.id !== id));
      if (viewOrder?.id === id) setViewOrder(null);
    }
  }

  function exportCSV() {
    const header = "Vendor,Amount,Status,Expected Delivery,Notes,Created";
    const rows = orders.map(o => [o.vendor?.name ?? "", o.amount, o.status, o.expectedDelivery ?? "", o.notes ?? "", new Date(o.createdAt).toLocaleDateString()].map(v => `"${String(v).replaceAll('"', '""')}"`).join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "purchase-orders.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const totalAmount = orders.reduce((s, o) => s + o.amount, 0);
  const pendingCount = orders.filter(o => o.status === "PENDING").length;
  const receivedCount = orders.filter(o => o.status === "RECEIVED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { label: "Total Orders", value: orders.length, color: "#6366f1", bg: "#ede9fe" },
          { label: "Pending Approval", value: pendingCount, color: "#f59e0b", bg: "#fef3c7" },
          { label: "Total Value", value: `₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: "#22c55e", bg: "#dcfce7" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button className="btn-ghost" onClick={exportCSV}><Download size={14} /> EXPORT</button>
        <div style={{ flex: 1 }} />
        {/* Status Filter Tabs */}
        <div style={{ display: "flex", gap: 6 }}>
          {["", "PENDING", "APPROVED", "RECEIVED", "CANCELLED"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99, border: "1px solid var(--border-color)", background: statusFilter === s ? "#6366f1" : "var(--bg-card)", color: statusFilter === s ? "white" : "var(--text-secondary)", cursor: "pointer" }}>
              {s || "All"}
            </button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="input" style={{ paddingLeft: 32, width: 200, fontSize: 13 }} placeholder="Search vendor..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus size={16} /> New Order
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Expected Delivery</th>
              <th>Created</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 16px" }}>
                <ShoppingCart size={32} style={{ opacity: 0.3, display: "block", margin: "0 auto 10px" }} />
                No purchase orders found.
              </td></tr>
            ) : (
              paginated.map((o, i) => (
                <tr key={o.id}>
                  <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.vendor?.name ?? "—"}</div>
                    {o.vendor?.email && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{o.vendor.email}</div>}
                  </td>
                  <td style={{ fontWeight: 700, color: "#22c55e" }}>₹{o.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td>
                    <select
                      value={o.status}
                      onChange={e => handleStatusChange(o.id, e.target.value)}
                      style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99, border: "none", cursor: "pointer", background: o.status === "RECEIVED" ? "#dcfce7" : o.status === "PENDING" ? "#fef9c3" : o.status === "APPROVED" ? "#cffafe" : "#fee2e2", color: o.status === "RECEIVED" ? "#15803d" : o.status === "PENDING" ? "#a16207" : o.status === "APPROVED" ? "#0e7490" : "#b91c1c" }}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{o.expectedDelivery ? new Date(o.expectedDelivery).toLocaleDateString("en-IN") : "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn-icon" title="View" onClick={() => setViewOrder(o)}><Eye size={15} style={{ color: "#06b6d4" }} /></button>
                      <button className="btn-icon" title="Delete" onClick={() => handleDelete(o.id)}><Trash2 size={15} style={{ color: "#ef4444" }} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--border-color)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{filtered.length} order{filtered.length !== 1 ? "s" : ""}</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn-icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ opacity: page === 1 ? 0.4 : 1 }}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{page} / {totalPages}</span>
            <button className="btn-icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ opacity: page === totalPages ? 0.4 : 1 }}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form className="card" onSubmit={handleCreate} style={{ width: 480, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>New Purchase Order</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Create a new purchase request</div>
              </div>
              <button type="button" className="btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Vendor *</label>
              {vendors.length === 0 ? (
                <div style={{ color: "#ef4444", fontSize: 13, padding: "8px 12px", background: "#fef2f2", borderRadius: 8 }}>No vendors found. Please add a vendor first.</div>
              ) : (
                <select className="input" value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Amount (₹) *</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="e.g. 50000.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Expected Delivery</label>
                <input className="input" type="date" value={form.expectedDelivery} onChange={e => setForm(f => ({ ...f, expectedDelivery: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Notes</label>
              <textarea className="input" rows={2} placeholder="Optional notes or items list..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#dc2626" }}>{error}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={saving || vendors.length === 0}>{saving ? "Creating..." : "Create Purchase Order"}</button>
            </div>
          </form>
        </div>
      )}

      {/* View Detail Modal */}
      {viewOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: 460, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Purchase Order Details</div>
              <button className="btn-icon" onClick={() => setViewOrder(null)}><X size={18} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
              {[
                { label: "Vendor", value: viewOrder.vendor?.name ?? "—" },
                { label: "Amount", value: `₹${viewOrder.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
                { label: "Status", value: viewOrder.status },
                { label: "Expected Delivery", value: viewOrder.expectedDelivery ? new Date(viewOrder.expectedDelivery).toLocaleDateString("en-IN") : "—" },
                { label: "Created", value: new Date(viewOrder.createdAt).toLocaleDateString("en-IN") },
                { label: "Vendor Email", value: viewOrder.vendor?.email ?? "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
            {viewOrder.notes && (
              <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg-page)", borderRadius: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>NOTES</div>
                {viewOrder.notes}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setViewOrder(null)}>Close</button>
              <button style={{ flex: 1, background: "#ef4444", color: "white", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: "8px" }} onClick={() => { handleDelete(viewOrder.id); }}>Delete Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
