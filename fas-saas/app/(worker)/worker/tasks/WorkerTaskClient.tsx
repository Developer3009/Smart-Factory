"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, PlayCircle, PauseCircle, AlertTriangle, LogOut, Clock } from "lucide-react";

const STATUS_CONFIG = [
  { key: "IN_PROGRESS", label: "Start", icon: <PlayCircle size={22} />, color: "#22c55e", bg: "#22c55e18" },
  { key: "QUEUED",      label: "Pause", icon: <PauseCircle size={22} />, color: "#f59e0b", bg: "#f59e0b18" },
  { key: "COMPLETED",   label: "Done",  icon: <CheckCircle size={22} />, color: "#6366f1", bg: "#6366f118" },
  { key: "ON_HOLD",     label: "Issue", icon: <AlertTriangle size={22} />, color: "#ef4444", bg: "#ef444418" },
];

export default function WorkerTaskClient({ user, workOrders: initial }: { user: any; workOrders: any[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initial);
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch(`/api/work-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    router.refresh();
  }

  async function logout() {
    await fetch("/api/worker-auth", { method: "DELETE" }).catch(() => {});
    document.cookie = "worker_session=; Max-Age=0; path=/";
    router.push("/worker");
  }

  const now = new Date();

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "0 0 40px 0" }}>
      {/* Header */}
      <div style={{ background: "rgba(99,102,241,0.15)", borderBottom: "1px solid rgba(99,102,241,0.3)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "white", fontSize: 18, fontWeight: 800, margin: 0 }}>👋 {user.name}</h1>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "2px 0 0" }}>{now.toLocaleDateString()} · {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      <div style={{ padding: "20px 16px" }}>
        <h2 style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>
          My Tasks Today — {orders.length} active
        </h2>

        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
            <p style={{ color: "white", fontSize: 18, fontWeight: 700 }}>All clear!</p>
            <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>No active tasks assigned to you.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {orders.map(wo => {
              const isUpdating = updating === wo.id;
              const overdue = new Date(wo.dueDate) < now;
              return (
                <div key={wo.id} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${overdue ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <p style={{ color: "white", fontSize: 16, fontWeight: 700, margin: 0 }}>{wo.product?.name ?? "Work Order"}</p>
                      <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>{wo.plant?.name ?? "—"}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: wo.status === "IN_PROGRESS" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)", color: wo.status === "IN_PROGRESS" ? "#22c55e" : "#f59e0b" }}>
                        {wo.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#94a3b8", fontSize: 13 }}>
                      <Clock size={14} />
                      <span style={{ color: overdue ? "#ef4444" : "#94a3b8", fontWeight: overdue ? 700 : 400 }}>Due: {new Date(wo.dueDate).toLocaleDateString()}</span>
                    </div>
                    <span style={{ color: "#64748b" }}>·</span>
                    <span style={{ color: "#94a3b8", fontSize: 13 }}>Qty: {wo.quantity}</span>
                  </div>
                  {/* Action Buttons */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {STATUS_CONFIG.map(cfg => (
                      <button key={cfg.key} onClick={() => updateStatus(wo.id, cfg.key)} disabled={isUpdating || wo.status === cfg.key}
                        style={{ padding: "10px 4px", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, background: wo.status === cfg.key ? cfg.bg : "rgba(255,255,255,0.06)", color: wo.status === cfg.key ? cfg.color : "#64748b", border: `1px solid ${wo.status === cfg.key ? cfg.color + "40" : "rgba(255,255,255,0.08)"}`, cursor: wo.status === cfg.key ? "default" : "pointer", transition: "all 0.15s", opacity: isUpdating ? 0.5 : 1 }}>
                        {cfg.icon}
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
