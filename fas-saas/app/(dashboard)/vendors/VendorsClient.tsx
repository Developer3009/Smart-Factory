"use client";

import { useState } from "react";
import { Truck, Plus, Trash2, X, UserPlus } from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  createdAt: Date | string;
}

export default function VendorsClient({ vendors: initial, orgId }: { vendors: Vendor[]; orgId: string }) {
  const [vendors, setVendors] = useState<Vendor[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Vendor name is required."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, organizationId: orgId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setVendors(prev => [data, ...prev]);
      setForm({ name: "", email: "", phone: "" });
      setShowForm(false);
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this vendor?")) return;
    const res = await fetch(`/api/vendors/${id}`, { method: "DELETE" });
    if (res.ok) setVendors(prev => prev.filter(v => v.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Vendors</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{vendors.length} vendor{vendors.length !== 1 ? "s" : ""}</div>
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }} onClick={() => { setShowForm(true); setError(""); }}>
          <Plus size={15} /> Add Vendor
        </button>
      </div>

      {/* Add Vendor Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: 440, padding: 28, position: "relative" }}>
            <button onClick={() => setShowForm(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Truck size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Add Vendor</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Add a new supplier to your organization</div>
              </div>
            </div>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Vendor Name *</label>
                <input className="input" placeholder="e.g. Steel Suppliers Ltd." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Email</label>
                <input className="input" type="email" placeholder="vendor@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Phone</label>
                <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{error}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>{loading ? "Adding…" : "Add Vendor"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead><tr><th style={{ width: 48 }}>#</th><th>Vendor Name</th><th>Email</th><th>Phone</th><th>Created</th><th style={{ width: 60 }}>Actions</th></tr></thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>No vendors yet. Click <strong>Add Vendor</strong> to get started.</td></tr>
            ) : vendors.map((v, i) => (
              <tr key={v.id}>
                <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{v.name}</td>
                <td style={{ color: "var(--text-secondary)" }}>{v.email ?? "—"}</td>
                <td style={{ color: "var(--text-secondary)" }}>{v.phone ?? "—"}</td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(v.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td><button onClick={() => handleDelete(v.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }} title="Delete"><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
