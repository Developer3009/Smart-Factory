"use client";

import { useState, useTransition } from "react";
import { Download, Plus, Search, Eye, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Role, ROLES } from "@/lib/roles";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

export default function MachinesClient({ machines, plants, role }: { machines: any[]; plants: any[]; role: Role }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", machineType: "CNC", description: "", plantId: plants[0]?.id ?? "" });

  async function createMachine(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create machine");
      setShowCreate(false);
      setForm({ name: "", machineType: "CNC", description: "", plantId: plants[0]?.id ?? "" });
      startTransition(() => router.refresh());
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create machine");
    } finally {
      setSaving(false);
    }
  }

  function exportMachines() {
    const header = "Name,Type,Status,Plant,Description";
    const rows = machines.map(machine => [machine.name, machine.machineType, machine.status, machine.plant?.name ?? "", machine.description ?? ""]
      .map(value => `"${String(value).replaceAll('"', '""')}"`).join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "machines.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const filtered = machines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.machineType.toLowerCase().includes(search.toLowerCase()) ||
    (m.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusBadge = (status: string) => {
    const isRunning = status === "RUNNING";
    const map: Record<string, string> = {
      RUNNING: "badge badge-green",
      IDLE:    "badge badge-yellow",
      DOWN:    "badge badge-red",
    };
    const label: Record<string, string> = { RUNNING: "Active", IDLE: "Idle", DOWN: "Offline" };
    const dotColor = isRunning ? "#22c55e" : status === "IDLE" ? "#f59e0b" : "#ef4444";

    return (
      <span className={map[status] ?? "badge badge-gray"} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ 
          width: 8, height: 8, borderRadius: "50%", background: dotColor,
          boxShadow: isRunning ? "0 0 8px rgba(34,197,94,0.6)" : "none",
          animation: isRunning ? "pulse 2s infinite" : "none"
        }} />
        {label[status] ?? status}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Controls */}
      <div className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn-ghost" onClick={exportMachines}>
          <Download size={14} />
          EXPORT
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="input"
            style={{ paddingLeft: 32, width: 220, fontSize: 13 }}
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {role !== ROLES.MEMBER && (
          <button className="btn-icon" title="Add machine" onClick={() => { setError(""); setShowCreate(true); }} style={{ border: "1px solid var(--border-color)", borderRadius: 8, padding: 6 }}>
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>Machine Details</th>
                <th>Description</th>
                <th>Machine Type</th>
                <th>Status</th>
                <th style={{ width: 80 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px 16px" }}>
                    No machines found.
                  </td>
                </tr>
              ) : (
                paginated.map((m, idx) => (
                  <tr key={m.id}>
                    <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{m.description ?? "-"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{m.machineType}</td>
                    <td>{statusBadge(m.status)}</td>
                    <td>
                      <button className="btn-icon" title="View details" onClick={() => setSelectedMachine(m)}>
                        <Eye size={16} style={{ color: "#06b6d4" }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
            padding: "12px 16px",
            borderTop: "1px solid var(--border-color)",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <button
            className="btn-icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ opacity: page === 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="btn-icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ opacity: page === totalPages ? 0.4 : 1 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {showCreate && role !== ROLES.MEMBER && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form className="card" onSubmit={createMachine} style={{ width: 460, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Add Machine</div>
              <button type="button" className="btn-icon" title="Close" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <input className="input" placeholder="Machine name, e.g. CNC Lathe A1" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required />
            <select className="input" value={form.machineType} onChange={event => setForm({ ...form, machineType: event.target.value })}>
              <option>CNC</option><option>Mill</option><option>Lathe</option><option>Robot</option><option>Press</option><option>General</option>
            </select>
            <select className="input" value={form.plantId} onChange={event => setForm({ ...form, plantId: event.target.value })} required>
              <option value="">Select plant...</option>
              {plants.map(plant => <option key={plant.id} value={plant.id}>{plant.name}</option>)}
            </select>
            <textarea className="input" placeholder="Description or controller details" rows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
            {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Add Machine"}</button>
          </form>
        </div>
      )}

      {selectedMachine && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: 460, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{selectedMachine.name}</div>
              <button className="btn-icon" title="Close" onClick={() => setSelectedMachine(null)}><X size={16} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 13 }}>
              <div><strong>Type</strong><br />{selectedMachine.machineType}</div>
              <div><strong>Status</strong><br />{selectedMachine.status}</div>
              <div><strong>Plant</strong><br />{selectedMachine.plant?.name ?? "-"}</div>
              <div><strong>Created</strong><br />{new Date(selectedMachine.createdAt).toLocaleDateString()}</div>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 18 }}>{selectedMachine.description || "No description recorded."}</p>
            <div style={{ marginTop: 18, padding: 12, background: "var(--bg-page)", borderRadius: 8, color: "var(--text-muted)", fontSize: 12 }}>
              Live CNC/PLC telemetry is supplied by the factory gateway through the IoT ingestion service.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
