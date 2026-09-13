"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, X, Search, Wrench, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "badge-cyan", MEDIUM: "badge-yellow", HIGH: "badge-red", CRITICAL: "badge-red",
};
const STATUS_COLORS: Record<string, string> = {
  OPEN: "badge-yellow", IN_PROGRESS: "badge-cyan", RESOLVED: "badge-green", CLOSED: "badge-green",
};
const MACHINE_STATUS_COLORS: Record<string, { bg: string; dot: string; label: string }> = {
  ACTIVE:  { bg: "#22c55e18", dot: "#22c55e", label: "Active" },
  IDLE:    { bg: "#f59e0b18", dot: "#f59e0b", label: "Idle" },
  STOPPED: { bg: "#ef444418", dot: "#ef4444", label: "Stopped" },
};

export default function MaintenanceClient({ tickets: initial, schedules, machines, plants }: {
  tickets: any[]; schedules: any[]; machines: any[]; plants: any[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tickets, setTickets] = useState(initial);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<"tickets" | "machines" | "schedules">("machines");

  // ── Stats ──
  const open = tickets.filter(t => t.status === "OPEN").length;
  const inProgress = tickets.filter(t => t.status === "IN_PROGRESS").length;
  const stoppedMachines = machines.filter(m => m.status === "STOPPED").length;

  // ── Filter ──
  const filtered = tickets.filter(t => {
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return t.title.toLowerCase().includes(s) || (t.machine?.name ?? "").toLowerCase().includes(s) || (t.plant?.name ?? "").toLowerCase().includes(s);
    }
    return true;
  });

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plantId: fd.get("plantId"), machineId: fd.get("machineId") || null,
        title: fd.get("title"), description: fd.get("description") || null,
        type: fd.get("type"), priority: fd.get("priority"),
      }),
    });
    if (res.ok) { setShowAdd(false); startTransition(() => router.refresh()); }
  }

  async function handleStatus(id: string, status: string) {
    await fetch(`/api/maintenance/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ticket?")) return;
    await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  return (
    <div style={{ padding: 28 }}>
      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Open Tickets", value: open, icon: <AlertTriangle size={20} />, color: "#f59e0b" },
          { label: "In Progress", value: inProgress, icon: <Wrench size={20} />, color: "#6366f1" },
          { label: "Stopped Machines", value: stoppedMachines, icon: <Zap size={20} />, color: "#ef4444" },
          { label: "Upcoming PM", value: schedules.filter(s => new Date(s.nextDueAt) < new Date(Date.now() + 7 * 86400000)).length, icon: <Clock size={20} />, color: "#22c55e" },
        ].map((c, i) => (
          <div key={i} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{c.label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>{c.value}</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: c.color }}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["machines", "tickets", "schedules"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? "btn-primary" : "btn-ghost"} style={{ fontSize: 13, padding: "8px 18px", textTransform: "capitalize" }}>{tab}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ gap: 6 }}><Plus size={15} />Create Ticket</button>
      </div>

      {/* ── Machine Health Grid ── */}
      {activeTab === "machines" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {machines.length === 0 ? (
            <p style={{ color: "var(--text-muted)", gridColumn: "1/-1", textAlign: "center", padding: 40 }}>No machines found</p>
          ) : machines.map(m => {
            const s = MACHINE_STATUS_COLORS[m.status] ?? MACHINE_STATUS_COLORS["IDLE"];
            return (
              <div key={m.id} className="card" style={{ padding: 18, background: s.bg, border: `1px solid ${s.dot}30` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.dot, boxShadow: `0 0 6px ${s.dot}` }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: s.dot }}>{s.label}</span>
                </div>
                <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{m.name}</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{m.machineType}</p>
                {m.lastHeartbeatAt && (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Last seen: {new Date(m.lastHeartbeatAt).toLocaleTimeString()}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tickets Table ── */}
      {activeTab === "tickets" && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13 }} />
            </div>
            {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className={filterStatus === s ? "btn-primary" : "btn-ghost"} style={{ fontSize: 12, padding: "7px 14px" }}>{s.replace("_", " ")}</button>
            ))}
          </div>
          <div className="card" style={{ overflow: "auto" }}>
            <table className="data-table" style={{ width: "100%" }}>
              <thead><tr><th>Title</th><th>Machine</th><th>Plant</th><th>Type</th><th>Priority</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No tickets found</td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                    <td>{t.machine?.name ?? "—"}</td>
                    <td>{t.plant?.name ?? "—"}</td>
                    <td><span className="badge-cyan">{t.type}</span></td>
                    <td><span className={PRIORITY_COLORS[t.priority] ?? "badge-cyan"}>{t.priority}</span></td>
                    <td>
                      <select value={t.status} onChange={e => handleStatus(t.id, e.target.value)}
                        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12 }}>
                        {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                      </select>
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn-icon" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Schedules ── */}
      {activeTab === "schedules" && (
        <div className="card" style={{ overflow: "auto" }}>
          <table className="data-table" style={{ width: "100%" }}>
            <thead><tr><th>Title</th><th>Machine</th><th>Plant</th><th>Frequency</th><th>Next Due</th><th>Last Done</th></tr></thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No schedules found</td></tr>
              ) : schedules.map(s => {
                const overdue = new Date(s.nextDueAt) < new Date();
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.title}</td>
                    <td>{s.machine?.name ?? "—"}</td>
                    <td>{s.plant?.name ?? "—"}</td>
                    <td><span className="badge-cyan">{s.frequency}</span></td>
                    <td style={{ color: overdue ? "#ef4444" : "var(--text-primary)", fontWeight: overdue ? 700 : 400 }}>
                      {new Date(s.nextDueAt).toLocaleDateString()}
                      {overdue && <span className="badge-red" style={{ marginLeft: 6 }}>OVERDUE</span>}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.lastCompletedAt ? new Date(s.lastCompletedAt).toLocaleDateString() : "Never"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Ticket Modal ── */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={() => setShowAdd(false)}>
          <div className="card" style={{ width: 500, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Create Maintenance Ticket</h3>
              <button className="btn-icon" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Plant *
                <select name="plantId" required style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }}>
                  <option value="">Select plant</option>
                  {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Machine (optional)
                <select name="machineId" style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }}>
                  <option value="">No specific machine</option>
                  {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Title *
                <input name="title" required placeholder="e.g. CNC spindle motor overheating" style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }} />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Type
                  <select name="type" style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }}>
                    <option value="BREAKDOWN">Breakdown</option>
                    <option value="PREVENTIVE">Preventive</option>
                    <option value="INSPECTION">Inspection</option>
                  </select>
                </label>
                <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Priority
                  <select name="priority" style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </label>
              </div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Description
                <textarea name="description" rows={3} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", resize: "vertical", marginTop: 4 }} />
              </label>
              <button type="submit" className="btn-primary">Create Ticket</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
