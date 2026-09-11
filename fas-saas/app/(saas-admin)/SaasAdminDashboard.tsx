"use client";

import { useState } from "react";
import {
  Building2, Users, LogIn, Activity, Server, AlertTriangle,
  Shield, UserPlus, X, Plus, ChevronDown, ChevronUp, Key, BarChart2
} from "lucide-react";

const PLAN_COLOR: Record<string, string> = { STARTER: "#06b6d4", PRO: "#6366f1", ENTERPRISE: "#f59e0b" };

interface OrgUser { id: string; name: string; email: string | null; role: string; clerkUserId: string; createdAt: Date | string; }
interface Organization { id: string; name: string; plan: string; createdAt: Date | string; _count: { users: number; plants: number; workOrders: number }; users?: OrgUser[]; }
interface ActiveSession { userId: string; email: string; name: string; org: string; lastActive: string; }
interface ClerkUser { id: string; email: string; name: string; createdAt: string; lastSignIn: string; }

export default function SaasAdminDashboard({
  stats, organizations: initialOrgs, planCounts, activeSessions, clerkUsers,
}: {
  stats: { orgsCount: number; totalMembers: number; totalLoggedInToday: number; activeSessions: number; failedLogins: number; serverMeta: { nodeVersion: string; platform: string; uptime: number; memMB: number } };
  organizations: Organization[];
  planCounts: any[];
  activeSessions: ActiveSession[];
  clerkUsers: ClerkUser[];
}) {
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrgs);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [orgForm, setOrgForm] = useState({ name: "", plan: "STARTER" });
  const [adminForm, setAdminForm] = useState({ name: "", email: "", clerkUserId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleAddOrg(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSuccess("");
    if (!orgForm.name.trim()) { setError("Name required."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orgForm) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setOrganizations(prev => [{ ...data, _count: { users: 0, plants: 0, workOrders: 0 }, users: [] }, ...prev]);
      setSuccess(`✅ "${orgForm.name}" created!`); setOrgForm({ name: "", plan: "STARTER" });
    } catch { setError("Network error."); } finally { setLoading(false); }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSuccess("");
    if (!selectedOrg || !adminForm.name.trim() || !adminForm.clerkUserId.trim()) { setError("All fields required."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...adminForm, role: "ADMIN", organizationId: selectedOrg }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setSuccess(`✅ ${adminForm.name} added as Admin!`); setAdminForm({ name: "", email: "", clerkUserId: "" }); setSelectedOrg("");
    } catch { setError("Network error."); } finally { setLoading(false); }
  }

  const totalMembersAcrossOrgs = organizations.reduce((s, o) => s + o._count.users, 0);

  // 6 Stat Boxes
  const STATS = [
    {
      id: "orgs",
      label: "Total Organizations",
      value: stats.orgsCount,
      icon: Building2,
      color: "#f59e0b", bg: "#fef3c7",
      desc: "Click to view all organizations",
    },
    {
      id: "members",
      label: "Total Members",
      value: totalMembersAcrossOrgs,
      icon: Users,
      color: "#6366f1", bg: "#ede9fe",
      desc: "Click to view all members with email",
    },
    {
      id: "loggedIn",
      label: "Logged In Today",
      value: stats.totalLoggedInToday,
      icon: LogIn,
      color: "#22c55e", bg: "#dcfce7",
      desc: "Sessions created since midnight",
    },
    {
      id: "sessions",
      label: "Active Sessions",
      value: stats.activeSessions,
      icon: Activity,
      color: "#06b6d4", bg: "#cffafe",
      desc: "Currently logged-in users",
    },
    {
      id: "server",
      label: "Server Metadata",
      value: `${stats.serverMeta.memMB}MB`,
      icon: Server,
      color: "#8b5cf6", bg: "#ede9fe",
      desc: "Runtime & memory info",
    },
    {
      id: "failed",
      label: "Failed Logins",
      value: stats.failedLogins,
      icon: AlertTriangle,
      color: "#ef4444", bg: "#fee2e2",
      desc: "Failed auth attempts today",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Platform Banner */}
      <div style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)", border: "1px solid #4338ca", borderRadius: 12, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={20} style={{ color: "#a5b4fc" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e0e7ff" }}>Platform Control Panel — SaaS Admin</div>
            <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>Full visibility over all organizations, users, and platform health.</div>
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

      {/* 6 Stat Boxes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {STATS.map(({ id, label, value, icon: Icon, color, bg, desc }) => (
          <button
            key={id}
            onClick={() => setActivePanel(activePanel === id ? null : id)}
            className="card"
            style={{ padding: 20, display: "flex", gap: 14, alignItems: "center", cursor: "pointer", border: activePanel === id ? `2px solid ${color}` : "1px solid var(--border-color)", textAlign: "left", width: "100%", background: "var(--bg-card)", transition: "all 0.2s" }}
          >
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginTop: 3 }}>{label}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
            </div>
            {activePanel === id ? <ChevronUp size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
          </button>
        ))}
      </div>

      {/* Expandable Detail Panels */}
      {activePanel === "orgs" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={16} style={{ color: "#f59e0b" }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>All Organizations</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>Click row to expand members</span>
          </div>
          <table className="data-table">
            <thead><tr><th>Organization</th><th>Plan</th><th>Members</th><th>Plants</th><th>Work Orders</th><th>Created</th></tr></thead>
            <tbody>
              {organizations.map(org => (
                <>
                  <tr key={org.id} style={{ cursor: "pointer" }} onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}>
                    <td><div style={{ fontWeight: 600 }}>{org.name}</div><div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{org.id}</div></td>
                    <td><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: (PLAN_COLOR[org.plan] ?? "#9ca3af") + "20", color: PLAN_COLOR[org.plan] ?? "#9ca3af" }}>{org.plan}</span></td>
                    <td style={{ fontWeight: 700 }}>{org._count.users}</td>
                    <td>{org._count.plants}</td>
                    <td>{org._count.workOrders}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(org.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</td>
                  </tr>
                  {expandedOrg === org.id && (
                    <tr key={org.id + "-expanded"}>
                      <td colSpan={6} style={{ padding: 0, background: "var(--bg-page)" }}>
                        <div style={{ padding: "14px 24px" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "var(--text-primary)" }}>👥 Members of {org.name}</div>
                          {!org.users?.length ? (
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No members yet.</div>
                          ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead><tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                                {["Name", "Email", "Role", "Clerk User ID", "Joined"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>{h}</th>)}
                              </tr></thead>
                              <tbody>
                                {org.users.map(u => (
                                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                    <td style={{ padding: "8px 10px", fontWeight: 600, fontSize: 13 }}>{u.name}</td>
                                    <td style={{ padding: "8px 10px", fontSize: 12, color: "#6366f1" }}>{u.email ?? "—"}</td>
                                    <td style={{ padding: "8px 10px" }}><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: u.role === "ADMIN" ? "#ede9fe" : "#dcfce7", color: u.role === "ADMIN" ? "#6366f1" : "#22c55e" }}>{u.role}</span></td>
                                    <td style={{ padding: "8px 10px", fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>{u.clerkUserId}</td>
                                    <td style={{ padding: "8px 10px", fontSize: 12, color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
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
      )}

      {activePanel === "members" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={16} style={{ color: "#6366f1" }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>All Members — Across All Organizations</span>
          </div>
          <table className="data-table">
            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Organization</th><th>Joined</th></tr></thead>
            <tbody>
              {organizations.flatMap(org => (org.users ?? []).map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: "#6366f1", fontSize: 13 }}>{u.email ?? "—"}</td>
                  <td><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: u.role === "ADMIN" ? "#ede9fe" : "#dcfce7", color: u.role === "ADMIN" ? "#6366f1" : "#22c55e" }}>{u.role}</span></td>
                  <td style={{ fontWeight: 500 }}>{org.name}</td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}

      {activePanel === "loggedIn" && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><LogIn size={16} style={{ color: "#22c55e" }} /><span style={{ fontWeight: 700, fontSize: 14 }}>Logins Today</span></div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#22c55e" }}>{stats.totalLoggedInToday}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>Total sessions created since midnight today. This count includes all organizations on the platform.</div>
        </div>
      )}

      {activePanel === "sessions" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={16} style={{ color: "#06b6d4" }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Active Sessions — Currently Logged In</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>{activeSessions.length} active</span>
          </div>
          {activeSessions.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No active sessions right now.</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Organization</th><th>Last Active</th></tr></thead>
              <tbody>
                {activeSessions.map((s, i) => (
                  <tr key={s.userId}>
                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: "#6366f1", fontSize: 13 }}>{s.email}</td>
                    <td>{s.org}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activePanel === "server" && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}><Server size={16} style={{ color: "#8b5cf6" }} /><span style={{ fontWeight: 700, fontSize: 14 }}>Server Metadata</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: "Node.js Version", value: stats.serverMeta.nodeVersion },
              { label: "Platform", value: stats.serverMeta.platform },
              { label: "Memory Used", value: `${stats.serverMeta.memMB} MB` },
              { label: "Server Uptime", value: `${Math.floor(stats.serverMeta.uptime / 60)} min` },
              { label: "Licensed Organizations", value: stats.orgsCount },
              { label: "Total Platform Members", value: totalMembersAcrossOrgs },
            ].map(({ label, value }) => (
              <div key={label} className="card" style={{ padding: "14px 18px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activePanel === "failed" && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><AlertTriangle size={16} style={{ color: "#ef4444" }} /><span style={{ fontWeight: 700, fontSize: 14 }}>Failed Login Attempts</span></div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#ef4444" }}>{stats.failedLogins}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>Failed authentication attempts are monitored by Clerk. For detailed security logs, visit the <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" style={{ color: "#6366f1" }}>Clerk Security Dashboard</a>.</div>
        </div>
      )}

      {/* Add Organization Modal */}
      {showAddOrg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: 440, padding: 28, position: "relative" }}>
            <button onClick={() => setShowAddOrg(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}><Building2 size={18} color="white" /></div>
              <div><div style={{ fontWeight: 700, fontSize: 15 }}>Create New Organization</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Register a new factory on the platform</div></div>
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
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}><button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddOrg(false)}>Cancel</button><button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>{loading ? "Creating…" : "Create Organization"}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Org Admin Modal */}
      {showAddAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: 480, padding: 28, position: "relative" }}>
            <button onClick={() => setShowAddAdmin(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#f59e0b,#f97316)", display: "flex", alignItems: "center", justifyContent: "center" }}><UserPlus size={18} color="white" /></div>
              <div><div style={{ fontWeight: 700, fontSize: 15 }}>Add Organization Admin</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Assign ADMIN role to a user in an organization</div></div>
            </div>
            <form onSubmit={handleAddAdmin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Select Organization *</label>
                <select className="input" value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)} required><option value="">— Choose —</option>{organizations.map(o => <option key={o.id} value={o.id}>{o.name} ({o.plan})</option>)}</select></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Admin Name *</label><input className="input" placeholder="e.g. Ramesh Patel" value={adminForm.name} onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Email</label><input className="input" type="email" placeholder="admin@factory.com" value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Clerk User ID *</label><input className="input" placeholder="user_2abc..." value={adminForm.clerkUserId} onChange={e => setAdminForm(f => ({ ...f, clerkUserId: e.target.value }))} required /><div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Find in Clerk Dashboard → Users → click user → copy User ID</div></div>
              {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{error}</div>}
              {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#16a34a" }}>{success}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}><button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddAdmin(false)}>Cancel</button><button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>{loading ? "Adding…" : "Add as Org Admin"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
