"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap, Activity, Square, TestTube } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "ACTIVE",  label: "Active",  color: "#22c55e", icon: <Activity size={16} /> },
  { value: "IDLE",    label: "Idle",    color: "#f59e0b", icon: <Zap size={16} /> },
  { value: "STOPPED", label: "Stopped", color: "#ef4444", icon: <Square size={16} /> },
];

export default function MachineTestClient({ machines }: { machines: any[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [updating, setUpdating] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function updateStatus(machineId: string, status: string) {
    setUpdating(machineId);
    await fetch(`/api/machines/${machineId}/status-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, source: "TEST", notes: notes[machineId] || null }),
    });
    setUpdating(null);
    startTransition(() => router.refresh());
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <TestTube size={24} color="#f59e0b" />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Machine Status Test Panel</h1>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Manually set machine status for testing. Changes are logged as source=TEST. This panel is hidden in production for non-SaaS-admins.</p>
        <div style={{ marginTop: 10, padding: "10px 16px", borderRadius: 8, background: "#f59e0b18", border: "1px solid #f59e0b40" }}>
          <p style={{ color: "#f59e0b", fontSize: 13, margin: 0 }}>⚠️ Dev/Test only. Every status change creates an immutable MachineStatusLog entry used for OEE calculations.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {machines.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", gridColumn: "1/-1" }}>No machines in the platform yet.</div>
        ) : machines.map(m => {
          const statusCfg = STATUS_OPTIONS.find(s => s.value === m.status) ?? STATUS_OPTIONS[1];
          return (
            <div key={m.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{m.name}</h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{m.plant?.organization?.name} · {m.plant?.name}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: `${statusCfg.color}18`, color: statusCfg.color, fontSize: 12, fontWeight: 700 }}>
                  {statusCfg.icon} {statusCfg.label}
                </div>
              </div>

              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                <span>Protocol: {m.protocol}</span>
                {m.lastHeartbeatAt && <span style={{ marginLeft: 12 }}>Last heartbeat: {new Date(m.lastHeartbeatAt).toLocaleTimeString()}</span>}
              </div>

              {/* Recent logs */}
              {m.statusLogs?.length > 0 && (
                <div style={{ marginBottom: 12, background: "var(--bg-page)", borderRadius: 8, padding: "8px 12px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Recent Logs</p>
                  {m.statusLogs.slice(0, 3).map((log: any) => (
                    <div key={log.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid var(--border-color)", fontSize: 12 }}>
                      <span style={{ color: STATUS_OPTIONS.find(s => s.value === log.status)?.color ?? "var(--text-secondary)", fontWeight: 600 }}>{log.status}</span>
                      <span style={{ color: "var(--text-muted)" }}>{new Date(log.changedAt).toLocaleTimeString()} · {log.source}</span>
                    </div>
                  ))}
                </div>
              )}

              <input
                value={notes[m.id] ?? ""}
                onChange={e => setNotes(n => ({ ...n, [m.id]: e.target.value }))}
                placeholder="Optional note for this status change..."
                style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border-color)", background: "var(--bg-page)", color: "var(--text-primary)", fontSize: 12, marginBottom: 10, boxSizing: "border-box" }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {STATUS_OPTIONS.map(cfg => (
                  <button key={cfg.value} onClick={() => updateStatus(m.id, cfg.value)} disabled={updating === m.id || m.status === cfg.value}
                    style={{ padding: "9px 0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12, fontWeight: 700,
                      background: m.status === cfg.value ? `${cfg.color}25` : "var(--bg-page)",
                      color: m.status === cfg.value ? cfg.color : "var(--text-secondary)",
                      border: `1px solid ${m.status === cfg.value ? cfg.color + "50" : "var(--border-color)"}`,
                      cursor: m.status === cfg.value ? "default" : "pointer", opacity: updating === m.id ? 0.6 : 1 }}>
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
