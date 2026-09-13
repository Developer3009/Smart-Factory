"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, X, Search, Users, Calendar, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ShiftsClient({ shifts: initial, members, plants }: {
  shifts: any[]; members: any[]; plants: any[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [shifts, setShifts] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const totalAssignmentsToday = shifts.reduce((acc, s) => {
    return acc + s.assignments.filter((a: any) => new Date(a.workDate).toDateString() === new Date().toDateString()).length;
  }, 0);

  async function handleAddShift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plantId: fd.get("plantId"), name: fd.get("name"), startTime: fd.get("startTime"), endTime: fd.get("endTime") }),
    });
    if (res.ok) { setShowAdd(false); startTransition(() => router.refresh()); }
  }

  async function handleAssign(e: React.FormEvent<HTMLFormElement>, shiftId: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/shifts/${shiftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignUserId: fd.get("userId"), workDate: fd.get("workDate"), notes: fd.get("notes") || null }),
    });
    setShowAssign(null);
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this shift?")) return;
    await fetch(`/api/shifts/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  const filtered = shifts.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.plant?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 28 }}>
      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Shifts", value: shifts.length, icon: <Clock size={20} />, color: "#6366f1" },
          { label: "Assigned Today", value: totalAssignmentsToday, icon: <Users size={20} />, color: "#22c55e" },
          { label: "Plants", value: plants.length, icon: <Calendar size={20} />, color: "#f59e0b" },
        ].map((c, i) => (
          <div key={i} className="card" style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{c.label}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>{c.value}</p>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: c.color }}>{c.icon}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shifts..." style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13 }} />
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ gap: 6 }}><Plus size={15} />Create Shift</button>
      </div>

      {/* ── Shifts Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", gridColumn: "1/-1" }}>No shifts found. Create one to get started.</div>
        ) : filtered.map(s => {
          const todayAssignments = s.assignments.filter((a: any) => new Date(a.workDate).toDateString() === new Date().toDateString());
          return (
            <div key={s.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{s.name}</h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.plant?.name ?? "—"}</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn-ghost" onClick={() => setShowAssign(s.id)} style={{ fontSize: 12, padding: "5px 10px", gap: 4 }}><Plus size={12} />Assign</button>
                  <button className="btn-icon" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <span className="badge-cyan"><Clock size={11} style={{ display: "inline", marginRight: 3 }} />{s.startTime} – {s.endTime}</span>
              </div>
              {/* Today's assignments */}
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Today's Workers ({todayAssignments.length})</p>
              {todayAssignments.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>No one assigned today</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {todayAssignments.map((a: any) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#6366f118", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#6366f1" }}>
                        {(a.user?.name ?? "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{a.user?.name ?? "Unknown"}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.user?.email ?? "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Add Shift Modal ── */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={() => setShowAdd(false)}>
          <div className="card" style={{ width: 440, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Create Shift</h3>
              <button className="btn-icon" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddShift} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Plant *
                <select name="plantId" required style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }}>
                  <option value="">Select plant</option>
                  {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Shift Name *
                <input name="name" required placeholder="e.g. Morning Shift" style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }} />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Start Time
                  <input name="startTime" type="time" defaultValue="06:00" style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }} />
                </label>
                <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>End Time
                  <input name="endTime" type="time" defaultValue="14:00" style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }} />
                </label>
              </div>
              <button type="submit" className="btn-primary">Create Shift</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Assign Worker Modal ── */}
      {showAssign && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={() => setShowAssign(null)}>
          <div className="card" style={{ width: 400, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Assign Worker to Shift</h3>
              <button className="btn-icon" onClick={() => setShowAssign(null)}><X size={18} /></button>
            </div>
            <form onSubmit={e => handleAssign(e, showAssign)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Worker *
                <select name="userId" required style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }}>
                  <option value="">Select worker</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email ?? m.role})</option>)}
                </select>
              </label>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Work Date *
                <input name="workDate" type="date" required defaultValue={today} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }} />
              </label>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Notes
                <input name="notes" placeholder="Optional notes" style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }} />
              </label>
              <button type="submit" className="btn-primary">Assign Worker</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
