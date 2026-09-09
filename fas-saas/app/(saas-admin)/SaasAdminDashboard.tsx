"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Factory, Cpu, Package, TrendingUp, Shield, UserPlus, X, Plus, Users, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";

const PLAN_COLOR: Record<string, string> = { STARTER: "#06b6d4", PRO: "#6366f1", ENTERPRISE: "#f59e0b" };

interface OrgUser { id: string; name: string; email: string | null; role: string; clerkUserId: string; createdAt: Date | string; }
interface Organization { id: string; name: string; plan: string; createdAt: Date | string; _count: { users: number; plants: number; workOrders: number }; users?: OrgUser[]; }

export default function SaasAdminDashboard({
  stats, organizations: initialOrgs, planCounts,
}: {
  stats: { orgsCount: number; totalWorkOrders: number; totalMachines: number; totalInventoryItems: number };
  organizations: Organization[];
  planCounts: any[];
}) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrgs);
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [orgForm, setOrgForm] = useState({ name: "", plan: "STARTER" });
  const [adminForm, setAdminForm] = useState({ name: "", email: "", clerkUserId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add Organization
  async function handleAddOrg(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSuccess("");
    if (!orgForm.name.trim()) { setError("Organization name is required."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orgForm) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setOrganizations(prev => [{ ...data, _count: { users: 0, plants: 0, workOrders: 0 }, users: [] }, ...prev]);
      setSuccess(`✅ Organization "${orgForm.name}" created!`);
      setOrgForm({ name: "", plan: "STARTER" });
      router.refresh();
    } catch { setError("Network error."); } finally { setLoading(false); }
  }

  // Add Org Admin
  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSuccess("");
    if (!selectedOrg) { setError("Select an organization."); return; }
    if (!adminForm.name.trim() || !adminForm.clerkUserId.trim()) { setError("Name and Clerk User ID are required."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...adminForm, role: "ADMIN", organizationId: selectedOrg }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      const orgName = organizations.find(o => o.id === selectedOrg)?.name ?? selectedOrg;
      setOrganizations(prev => prev.map(org => org.id === selectedOrg
        ? { ...org, _count: { ...org._count, users: org._count.users + 1 }, users: [...(org.users ?? []), data] }
        : org));
      setSuccess(`✅ ${adminForm.name} added as Admin to "${orgName}"!`);
      setAdminForm({ name: "", email: "", clerkUserId: "" }); setSelectedOrg("");
      router.refresh();
    } catch { setError("Network error."); } finally { setLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Platform Banner */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", border: "1px solid #4338ca", borderRadius: 12, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Shield size={22} style={{ color: "#a5b4fc", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e0e7ff" }}>SaaS Admin — Platform Control Panel</div>
            <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>You have full control over all organizations and their admins.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }} onClick={() => { setShowAddOrg(true); setError(""); setSuccess(""); }}>
            <Building2 size={14} /> Add Organization
          </button>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "#f59e0b" }} onClick={() => { setShowAddAdmin(true); setError(""); setSuccess(""); }}>
            <UserPlus size={14} /> Add Org Admin
          </button>
        </div>
      </div>

      {/* Add Organization Modal */}
      {showAddOrg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: 440, padding: 28, position: "relative" }}>
            <button onClick={() => { setShowAddOrg(false); setError(""); setSuccess(""); }} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}><Building2 size={18} color="white" /></div>
              <div><div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Create New Organization</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Register a new factory on the platform</div></div>
            </div>
            <form onSubmit={handleAddOrg} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Organization Name *</label><input className="input" placeholder="e.g. Tata Steel Manufacturing" value={orgForm.name} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Plan</label>
                <select className="input" value={orgForm.plan} onChange={e => setOrgForm(f => ({ ...f, plan: e.target.value }))}>
                  <option value="STARTER">Starter</option><option value="PRO">Pro</option><option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
              {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{error}</div>}
              {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#16a34a" }}>{success}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}><button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowAddOrg(false); setError(""); setSuccess(""); }}>Cancel</button><button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>{loading ? "Creating…" : "Create Organization"}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Org Admin Modal */}
      {showAddAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: 480, padding: 28, position: "relative" }}>
            <button onClick={() => { setShowAddAdmin(false); setError(""); setSuccess(""); }} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#f59e0b,#f97316)", display: "flex", alignItems: "center", justifyContent: "center" }}><UserPlus size={18} color="white" /></div>
              <div><div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Add Organization Admin</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Grant ADMIN role to a user for a specific organization</div></div>
            </div>
            <form onSubmit={handleAddAdmin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Select Organization *</label>
                <select className="input" value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)} required><option value="">— Choose —</option>{organizations.map(org => <option key={org.id} value={org.id}>{org.name} ({org.plan})</option>)}</select></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Admin Name *</label><input className="input" placeholder="e.g. Ramesh Patel" value={adminForm.name} onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Email</label><input className="input" type="email" placeholder="admin@factory.com" value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Clerk User ID *</label><input className="input" placeholder="user_2abc123xyz..." value={adminForm.clerkUserId} onChange={e => setAdminForm(f => ({ ...f, clerkUserId: e.target.value }))} required /><div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Find in Clerk Dashboard → Users → click user → copy User ID</div></div>
              {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{error}</div>}
              {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#16a34a" }}>{success}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}><button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowAddAdmin(false); setError(""); setSuccess(""); }}>Cancel</button><button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>{loading ? "Adding…" : "Add as Org Admin"}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Platform Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Total Organizations", value: stats.orgsCount, icon: Building2, color: "#f59e0b", bg: "#fef3c7" },
          { label: "Total Work Orders", value: stats.totalWorkOrders, icon: Factory, color: "#6366f1", bg: "#ede9fe" },
          { label: "Total Machines", value: stats.totalMachines, icon: Cpu, color: "#06b6d4", bg: "#cffafe" },
          { label: "Total Inventory", value: stats.totalInventoryItems, icon: Package, color: "#22c55e", bg: "#dcfce7" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: 20, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={20} style={{ color }} /></div>
            <div><div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div><div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{label}</div></div>
          </div>
        ))}
      </div>

      {/* Plan Breakdown + Orgs Table */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}><TrendingUp size={14} style={{ display: "inline", marginRight: 6 }} />Revenue Tiers</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {planCounts.map((p: any) => (
              <div key={p.plan} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: PLAN_COLOR[p.plan] ?? "#9ca3af" }} /><span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{p.plan}</span></div>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: (PLAN_COLOR[p.plan] ?? "#9ca3af") + "20", color: PLAN_COLOR[p.plan] ?? "#9ca3af" }}>{p._count._all}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All Organizations Table with expandable login details */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}><Building2 size={14} style={{ display: "inline", marginRight: 6 }} />All Organizations — Click to view members</div>
            <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }} onClick={() => { setShowAddOrg(true); setError(""); setSuccess(""); }}>
              <Plus size={14} /> Add Organization
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Organization</th><th>Plan</th><th>Users</th><th>Plants</th><th>Orders</th><th>Joined</th><th style={{ width: 60 }}>Details</th></tr></thead>
              <tbody>
                {organizations.map((org) => (
                  <>
                    <tr key={org.id} style={{ cursor: "pointer" }} onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}>
                      <td><div style={{ fontWeight: 600 }}>{org.name}</div><div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{org.id.slice(0, 16)}…</div></td>
                      <td><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: (PLAN_COLOR[org.plan] ?? "#9ca3af") + "20", color: PLAN_COLOR[org.plan] ?? "#9ca3af" }}>{org.plan}</span></td>
                      <td style={{ fontWeight: 600 }}>{org._count.users}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{org._count.plants}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{org._count.workOrders}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(org.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</td>
                      <td>{expandedOrg === org.id ? <ChevronUp size={16} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />}</td>
                    </tr>
                    {/* Expanded: show members of this org */}
                    {expandedOrg === org.id && (
                      <tr key={org.id + "-details"}>
                        <td colSpan={7} style={{ padding: 0, background: "var(--bg-page)" }}>
                          <div style={{ padding: "16px 24px" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Users size={14} /> Members of {org.name}</div>
                            {(!org.users || org.users.length === 0) ? (
                              <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0" }}>No members in this organization yet.</div>
                            ) : (
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead><tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                                  <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>Name</th>
                                  <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>Email</th>
                                  <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>Role</th>
                                  <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>Clerk User ID</th>
                                  <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>Joined</th>
                                </tr></thead>
                                <tbody>
                                  {org.users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                      <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 600 }}>{u.name}</td>
                                      <td style={{ padding: "8px 10px", fontSize: 12, color: "var(--text-secondary)" }}>{u.email ?? "—"}</td>
                                      <td style={{ padding: "8px 10px" }}><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: u.role === "ADMIN" ? "#ede9fe" : "#dcfce7", color: u.role === "ADMIN" ? "#6366f1" : "#22c55e" }}>{u.role}</span></td>
                                      <td style={{ padding: "8px 10px", fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>{u.clerkUserId}</td>
                                      <td style={{ padding: "8px 10px", fontSize: 12, color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
