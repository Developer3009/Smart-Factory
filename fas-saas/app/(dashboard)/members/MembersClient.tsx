"use client";

import { useState } from "react";
import { UserCog, Crown, Wrench, Shield, Plus, Trash2, X, UserPlus } from "lucide-react";
import { Role, ROLES } from "@/lib/roles";

const ROLE_MAP: Record<string, { label: string; color: string; bg: string; icon: any; desc: string }> = {
  ADMIN:         { label: "Admin",        color: "#6366f1", bg: "#ede9fe", icon: Crown,   desc: "Full access: all data, settings, billing, users" },
  PLANT_MANAGER: { label: "Plant Manager",color: "#f59e0b", bg: "#fef3c7", icon: UserCog, desc: "All production data, no billing or user management" },
  SUPERVISOR:    { label: "Supervisor",   color: "#06b6d4", bg: "#cffafe", icon: Shield,  desc: "Their plant only: work orders, machines, inventory" },
  OPERATOR:      { label: "Operator",     color: "#22c55e", bg: "#dcfce7", icon: Wrench,  desc: "Their machine only: active work order + log production" },
};

interface Member {
  id: string;
  clerkUserId: string;
  name: string;
  email?: string | null;
  role: string;
  createdAt: Date | string;
}

interface Props {
  members: Member[];
  role: Role;        // caller's role
  orgId: string;
  loadError?: string;
}

export default function MembersClient({ members: initialMembers, role, orgId, loadError = "" }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", clerkUserId: "", role: "OPERATOR" });

  // Roles the caller is allowed to assign
  const assignableRoles = role === ROLES.SAAS_ADMIN
    ? ["ADMIN", "PLANT_MANAGER", "SUPERVISOR", "OPERATOR"]
    : ["PLANT_MANAGER", "SUPERVISOR", "OPERATOR"];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.clerkUserId.trim()) {
      setError("Name and Clerk User ID are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, organizationId: orgId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to add member"); return; }
      setMembers(prev => [...prev, data]);
      setForm({ name: "", email: "", clerkUserId: "", role: "OPERATOR" });
      setShowForm(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this member from the organization?")) return;
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (res.ok) setMembers(prev => prev.filter(m => m.id !== id));
    } catch { /* ignore */ }
  }

  async function handleRoleChange(id: string, newRole: string) {
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
      }
    } catch { /* ignore */ }
  }

  const canManage = role === ROLES.ORG_ADMIN || role === ROLES.SAAS_ADMIN;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Team Members</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {members.length} member{members.length !== 1 ? "s" : ""} in this organization
          </div>
        </div>
        {canManage && (
          <button
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
            onClick={() => { setShowForm(true); setError(""); }}
          >
            <UserPlus size={15} />
            Add Member
          </button>
        )}
      </div>

      {loadError && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#b91c1c" }}>
          {loadError}
        </div>
      )}

      {/* Add Member Form Modal */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div className="card" style={{ width: 460, padding: 28, position: "relative" }}>
            {/* Close */}
            <button
              onClick={() => { setShowForm(false); setError(""); }}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              <X size={18} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Add Member</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Add a new team member to this organization</div>
              </div>
            </div>

            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>
                  Full Name *
                </label>
                <input
                  className="input"
                  placeholder="e.g. John Smith"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>
                  Email Address
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="john@factory.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>
                  Clerk User ID *
                </label>
                <input
                  className="input"
                  placeholder="user_2abc123xyz..."
                  value={form.clerkUserId}
                  onChange={e => setForm(f => ({ ...f, clerkUserId: e.target.value }))}
                  required
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  Find this in Clerk Dashboard → Users → click user → copy User ID
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>
                  Role *
                </label>
                <select
                  className="input"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                >
                  {assignableRoles.map(r => (
                    <option key={r} value={r}>{ROLE_MAP[r]?.label ?? r}</option>
                  ))}
                </select>
                {form.role && ROLE_MAP[form.role] && (
                  <div style={{ fontSize: 11, color: ROLE_MAP[form.role].color, marginTop: 4 }}>
                    {ROLE_MAP[form.role].desc}
                  </div>
                )}
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => { setShowForm(false); setError(""); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  disabled={loading}
                >
                  {loading ? "Adding…" : <><UserPlus size={14} /> Add Member</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <th>Member</th>
              <th>Clerk User ID</th>
              <th>Role</th>
              <th>Joined</th>
              {canManage && <th style={{ width: 80 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
                  No members yet. Click <strong>Add Member</strong> to invite team members.
                </td>
              </tr>
            ) : members.map((m, idx) => {
              const roleData = ROLE_MAP[m.role] ?? ROLE_MAP.OPERATOR;
              const RoleIcon = roleData.icon;
              return (
                <tr key={m.id}>
                  <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{idx + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0,
                      }}>
                        {(m.name?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.email ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>
                    {m.clerkUserId.slice(0, 20)}…
                  </td>
                  <td>
                    {canManage ? (
                      <select
                        value={m.role}
                        onChange={e => handleRoleChange(m.id, e.target.value)}
                        style={{
                          fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
                          background: roleData.bg, color: roleData.color,
                          border: "none", cursor: "pointer", outline: "none",
                        }}
                      >
                        {assignableRoles.map(r => (
                          <option key={r} value={r}>{ROLE_MAP[r]?.label ?? r}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                        background: roleData.bg, color: roleData.color,
                      }}>
                        <RoleIcon size={11} />
                        {roleData.label}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  {canManage && (
                    <td>
                      <button
                        onClick={() => handleDelete(m.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4, borderRadius: 6 }}
                        title="Remove member"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role Permissions Guide */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Role Permissions Guide</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 12 }}>
          {Object.entries(ROLE_MAP).map(([r, data]) => {
            const Icon = data.icon;
            return (
              <div key={r} style={{ padding: "14px 16px", borderRadius: 10, background: "var(--bg-page)", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: data.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} style={{ color: data.color }} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: data.color }}>{data.label}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{data.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
