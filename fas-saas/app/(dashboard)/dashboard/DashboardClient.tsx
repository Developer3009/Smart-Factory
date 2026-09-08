"use client";

import {
  Eye, DollarSign, Package, Users,
  Warehouse, Layers, UserCheck, Settings,
  Printer,
} from "lucide-react";

// ── Stat card definitions ────────────────────────────────────────────
const statCards = (s: any) => [
  { label: "Total Orders",       value: s.orders,       icon: Eye,        bg: "#22c55e", row: 1 },
  { label: "Total Profit",       value: `${(s.totalProfit / 1000).toFixed(0)}K`, icon: DollarSign, bg: "#f97316", row: 1 },
  { label: "Total Products",     value: s.products,     icon: Package,    bg: "#8b5cf6", row: 1 },
  { label: "Total Customers",    value: s.customers,    icon: Users,      bg: "#06b6d4", row: 1 },
  { label: "Total Inventory",    value: s.inventory,    icon: Warehouse,  bg: "#ef4444", row: 2 },
  { label: "Total Raw Materials",value: s.rawMaterials, icon: Layers,     bg: "#8b5cf6", row: 2 },
  { label: "Total Employees",    value: s.employees,    icon: UserCheck,  bg: "#06b6d4", row: 2 },
  { label: "Total Machines",     value: s.machines,     icon: Settings,   bg: "#1f2937", row: 2 },
];

function StatCard({ label, value, icon: Icon, bg }: { label: string; value: any; icon: any; bg: string }) {
  return (
    <div
      className="card"
      style={{
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "";
      }}
    >
      <div className="icon-circle" style={{ background: bg }}>
        <Icon size={22} color="white" />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    IN_PROGRESS: "badge badge-cyan",
    QUEUED:      "badge badge-yellow",
    COMPLETED:   "badge badge-green",
    ON_HOLD:     "badge badge-red",
  };
  const label: Record<string, string> = {
    IN_PROGRESS: "In Progress",
    QUEUED:      "Pending",
    COMPLETED:   "Completed",
    ON_HOLD:     "On Hold",
  };
  return <span className={map[status] ?? "badge badge-gray"}>{label[status] ?? status}</span>;
}

export default function DashboardClient({ stats }: { stats: any }) {
  const cards = statCards(stats);
  const ps = stats.productionStatus;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Stat Cards Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* ── Today's Production Overview ── */}
      <div
        className="card"
        style={{ padding: "22px 24px", background: "var(--bg-card)" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
            Todays Production Overview
          </h2>
          <button className="btn-primary" style={{ gap: 6 }}>
            <Printer size={15} />
            Print Production
          </button>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {/* Production Table */}
          <div style={{ flex: 1, overflow: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Machine Name</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Estimate Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.workOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 16px", fontSize: 13 }}
                    >
                      No Pending or In Progress Productions of Today.
                    </td>
                  </tr>
                ) : (
                  stats.workOrders.map((wo: any) => (
                    <tr key={wo.id}>
                      <td style={{ fontWeight: 500 }}>{wo.product?.name ?? "—"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {wo.plant?.machines?.[0]?.name ?? "—"}
                      </td>
                      <td>{wo.quantity}</td>
                      <td><StatusBadge status={wo.status} /></td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {wo.estimatedHrs ? `${wo.estimatedHrs} HR.` : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Production Status Donut */}
          <div
            style={{
              minWidth: 220,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <div style={{ position: "relative", width: 120, height: 120 }}>
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border-color)" strokeWidth="14" />
                {/* Pending arc — yellow */}
                <circle
                  cx="60" cy="60" r="50"
                  fill="none" stroke="#f59e0b" strokeWidth="14"
                  strokeDasharray={`${(Number(ps.pendingPct) / 100) * 314.16} 314.16`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                {/* In Progress arc — cyan */}
                <circle
                  cx="60" cy="60" r="50"
                  fill="none" stroke="#06b6d4" strokeWidth="14"
                  strokeDasharray={`${(Number(ps.inProgressPct) / 100) * 314.16} 314.16`}
                  strokeLinecap="round"
                  strokeDashoffset={`-${(Number(ps.pendingPct) / 100) * 314.16}`}
                  transform="rotate(-90 60 60)"
                />
                {/* Completed arc — green */}
                <circle
                  cx="60" cy="60" r="50"
                  fill="none" stroke="#22c55e" strokeWidth="14"
                  strokeDasharray={`${(Number(ps.completedPct) / 100) * 314.16} 314.16`}
                  strokeLinecap="round"
                  strokeDashoffset={`-${(Number(ps.pendingPct) / 100) * 314.16 + (Number(ps.inProgressPct) / 100) * 314.16}`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div
                style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Production</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Status</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
                  {ps.total}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { color: "#f59e0b", label: `Pending: ${ps.pendingPct}%` },
                { color: "#06b6d4", label: `In Progress: ${ps.inProgressPct}%` },
                { color: "#22c55e", label: `Completed: ${ps.completedPct}%` },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
