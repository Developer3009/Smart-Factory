"use client";

import { Building2, Shield, CreditCard, Bell, Globe } from "lucide-react";
import { Role, ROLES } from "@/lib/roles";

export default function SettingsClient({ orgId, role }: { orgId: string; role: Role }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>

      {/* Org Info */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Building2 size={18} style={{ color: "#6366f1" }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Organization</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Organization ID
            </label>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-secondary)", background: "var(--bg-page)", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-color)" }}>
              {orgId}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Your Role
            </label>
            <div style={{
              fontSize: 13, fontWeight: 700, padding: "8px 12px", borderRadius: 8,
              background: role === ROLES.SAAS_ADMIN ? "#fef3c7" : "#ede9fe",
              color: role === ROLES.SAAS_ADMIN ? "#92400e" : "#5b21b6",
              border: "1px solid var(--border-color)",
            }}>
              {role}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Bell size={18} style={{ color: "#f59e0b" }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Notifications</div>
        </div>
        {[
          ["Low stock alerts", "Get notified when inventory falls below reorder point", true],
          ["Machine downtime alerts", "Alert when a machine status changes to DOWN", true],
          ["Work order completion", "Notify when work orders are completed", false],
          ["Daily production report", "Email summary of daily production stats", false],
        ].map(([label, desc, enabled]) => (
          <div key={label as string} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{label as string}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{desc as string}</div>
            </div>
            <div style={{
              width: 44, height: 24, borderRadius: 99, cursor: "pointer",
              background: enabled ? "#6366f1" : "var(--border-color)",
              position: "relative", flexShrink: 0, transition: "background 0.2s",
            }}>
              <div style={{
                position: "absolute", top: 3, left: enabled ? 22 : 2,
                width: 18, height: 18, borderRadius: "50%",
                background: "white", transition: "left 0.2s",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Billing */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <CreditCard size={18} style={{ color: "#22c55e" }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Billing & Plan</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "var(--bg-page)", borderRadius: 10, border: "1px solid var(--border-color)" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#6366f1" }}>PRO Plan</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Unlimited machines · 5 plants · Email support</div>
          </div>
          <button className="btn-primary" style={{ fontSize: 13 }}>Upgrade to Enterprise</button>
        </div>
      </div>
    </div>
  );
}
