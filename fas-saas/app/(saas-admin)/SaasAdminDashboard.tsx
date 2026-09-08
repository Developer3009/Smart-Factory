"use client";

import { Building2, Factory, Cpu, Package, TrendingUp, Users, Shield, CheckCircle, AlertCircle, Clock } from "lucide-react";

const PLAN_COLOR: Record<string, string> = {
  STARTER: "#06b6d4",
  PRO: "#6366f1",
  ENTERPRISE: "#f59e0b",
};

export default function SaasAdminDashboard({
  stats,
  organizations,
  planCounts,
}: {
  stats: { orgsCount: number; totalWorkOrders: number; totalMachines: number; totalInventoryItems: number };
  organizations: any[];
  planCounts: any[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Platform alert banner */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
        border: "1px solid #4338ca",
        borderRadius: 12, padding: "16px 24px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <Shield size={22} style={{ color: "#a5b4fc", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e0e7ff" }}>Platform Admin View</div>
          <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>
            You are viewing aggregate data across ALL organizations. No tenant filter applied.
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Total Organizations", value: stats.orgsCount, icon: Building2, color: "#f59e0b", bg: "#fef3c7" },
          { label: "Total Work Orders", value: stats.totalWorkOrders, icon: Factory, color: "#6366f1", bg: "#ede9fe" },
          { label: "Total Machines", value: stats.totalMachines, icon: Cpu, color: "#06b6d4", bg: "#cffafe" },
          { label: "Total Inventory Items", value: stats.totalInventoryItems, icon: Package, color: "#22c55e", bg: "#dcfce7" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: 20, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            <TrendingUp size={14} style={{ display: "inline", marginRight: 6 }} />
            Revenue Tiers
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {planCounts.map((p: any) => (
              <div key={p.plan} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: PLAN_COLOR[p.plan] ?? "#9ca3af" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{p.plan}</span>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 99,
                  background: PLAN_COLOR[p.plan] + "20", color: PLAN_COLOR[p.plan],
                }}>{p._count._all}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All Organizations Table */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            <Building2 size={14} style={{ display: "inline", marginRight: 6 }} />
            All Organizations
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Plan</th>
                  <th>Users</th>
                  <th>Plants</th>
                  <th>Work Orders</th>
                  <th>Machines</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org: any) => (
                  <tr key={org.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{org.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{org.id}</div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                        background: (PLAN_COLOR[org.plan] ?? "#9ca3af") + "20",
                        color: PLAN_COLOR[org.plan] ?? "#9ca3af",
                      }}>{org.plan}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{org._count.users}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{org._count.plants}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{org._count.workOrders}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{org._count.machines}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {new Date(org.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
