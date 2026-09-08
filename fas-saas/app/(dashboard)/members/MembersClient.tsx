"use client";

import { UserCog, Crown, Wrench, Shield } from "lucide-react";

const ROLE_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  ADMIN:        { label: "Admin",        color: "#6366f1", bg: "#ede9fe", icon: Crown },
  PLANT_MANAGER:{ label: "Plant Manager",color: "#f59e0b", bg: "#fef3c7", icon: UserCog },
  SUPERVISOR:   { label: "Supervisor",   color: "#06b6d4", bg: "#cffafe", icon: Shield },
  OPERATOR:     { label: "Operator",     color: "#22c55e", bg: "#dcfce7", icon: Wrench },
};

export default function MembersClient({ members }: { members: any[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      <div className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Team Members</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {members.length} member{members.length !== 1 ? "s" : ""} in this organization
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--bg-page)", padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border-color)" }}>
          Invite via Clerk Dashboard → Organizations
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <th>Member</th>
              <th>Clerk User ID</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                  No members yet. Invite users from your Clerk Dashboard → Organizations.
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
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0,
                      }}>
                        {(m.name?.[0] ?? m.clerkUserId[0] ?? "?").toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name ?? "Unnamed"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.email ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>
                    {m.clerkUserId.slice(0, 20)}…
                  </td>
                  <td>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                      background: roleData.bg, color: roleData.color,
                    }}>
                      <RoleIcon size={11} />
                      {roleData.label}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role explanation */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Role Permissions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {Object.entries(ROLE_MAP).map(([role, data]) => {
            const Icon = data.icon;
            return (
              <div key={role} style={{ padding: "14px 16px", borderRadius: 10, background: "var(--bg-page)", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: data.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} style={{ color: data.color }} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: data.color }}>{data.label}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {role === "ADMIN" && "Full access: all data, settings, billing, users"}
                  {role === "PLANT_MANAGER" && "All production data, no billing or user management"}
                  {role === "SUPERVISOR" && "Their plant only: work orders, machines, inventory"}
                  {role === "OPERATOR" && "Their machine only: active work order + log production"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
