"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, X, Search, Download, ClipboardCheck, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 15;

const RESULT_COLORS: Record<string, string> = {
  PASS: "badge-green",
  FAIL: "badge-red",
  CONDITIONAL: "badge-yellow",
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "badge-cyan",
  MEDIUM: "badge-yellow",
  HIGH: "badge-red",
  CRITICAL: "badge-red",
};

export default function QcClient({ inspections: initial, plants }: { inspections: any[]; plants: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [inspections, setInspections] = useState(initial);
  const [search, setSearch] = useState("");
  const [filterResult, setFilterResult] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [page, setPage] = useState(0);

  // ── Stats ──
  const total = inspections.length;
  const passed = inspections.filter(i => i.result === "PASS").length;
  const failed = inspections.filter(i => i.result === "FAIL").length;
  const pending = inspections.filter(i => !i.result).length;
  const passRate = total > 0 ? Math.round((passed / (passed + failed || 1)) * 100) : 0;

  // ── Filter + Search ──
  const filtered = inspections.filter(i => {
    if (filterResult !== "ALL" && i.result !== filterResult && !(filterResult === "PENDING" && !i.result)) return false;
    if (search) {
      const s = search.toLowerCase();
      return (i.plant?.name ?? "").toLowerCase().includes(s) || (i.inspectionType ?? "").toLowerCase().includes(s) || (i.notes ?? "").toLowerCase().includes(s);
    }
    return true;
  });
  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── Add Inspection ──
  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/qc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plantId: fd.get("plantId"),
        inspectionType: fd.get("inspectionType"),
        result: fd.get("result") || null,
        sampleSize: Number(fd.get("sampleSize")) || 1,
        defectsFound: Number(fd.get("defectsFound")) || 0,
        notes: fd.get("notes") || null,
      }),
    });
    if (res.ok) { setShowAdd(false); startTransition(() => router.refresh()); }
  }

  // ── Update Result ──
  async function handleResult(id: string, result: string) {
    await fetch(`/api/qc/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    });
    startTransition(() => router.refresh());
  }

  // ── Delete ──
  async function handleDelete(id: string) {
    if (!confirm("Delete this inspection?")) return;
    await fetch(`/api/qc/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  // ── Export ──
  function exportCSV() {
    const headers = ["Date", "Plant", "Type", "Result", "Sample Size", "Defects", "Notes"];
    const rows = filtered.map(i => [
      new Date(i.inspectedAt).toLocaleDateString(), i.plant?.name ?? "", i.inspectionType, i.result ?? "PENDING", i.sampleSize, i.defectsFound, (i.notes ?? "").replace(/,/g, ";"),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "qc_inspections.csv"; a.click();
  }

  return (
    <div style={{ padding: 28 }}>
      {/* ── Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Inspections", value: total, icon: <ClipboardCheck size={20} />, color: "#6366f1" },
          { label: "Pass Rate", value: `${passRate}%`, icon: <CheckCircle size={20} />, color: "#22c55e" },
          { label: "Failed", value: failed, icon: <XCircle size={20} />, color: "#ef4444" },
          { label: "Pending Review", value: pending, icon: <AlertTriangle size={20} />, color: "#f59e0b" },
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

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search inspections..." style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13 }} />
        </div>
        {["ALL", "PASS", "FAIL", "CONDITIONAL", "PENDING"].map(r => (
          <button key={r} onClick={() => { setFilterResult(r); setPage(0); }}
            className={filterResult === r ? "btn-primary" : "btn-ghost"}
            style={{ fontSize: 12, padding: "7px 14px" }}>{r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}</button>
        ))}
        <button className="btn-ghost" onClick={exportCSV} style={{ gap: 6 }}><Download size={14} />Export</button>
        <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ gap: 6 }}><Plus size={15} />Log Inspection</button>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ overflow: "auto" }}>
        <table className="data-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Date</th><th>Plant</th><th>Type</th><th>Result</th><th>Sample</th><th>Defects</th><th>NCRs</th><th>Notes</th><th style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No inspections found</td></tr>
            ) : pageData.map(i => (
              <tr key={i.id}>
                <td>{new Date(i.inspectedAt).toLocaleDateString()}</td>
                <td>{i.plant?.name ?? "—"}</td>
                <td><span className="badge-cyan">{i.inspectionType}</span></td>
                <td>
                  {i.result ? (
                    <span className={RESULT_COLORS[i.result] ?? "badge-cyan"}>{i.result}</span>
                  ) : (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => handleResult(i.id, "PASS")} className="btn-ghost" style={{ fontSize: 11, padding: "3px 8px", color: "#22c55e" }}>Pass</button>
                      <button onClick={() => handleResult(i.id, "FAIL")} className="btn-ghost" style={{ fontSize: 11, padding: "3px 8px", color: "#ef4444" }}>Fail</button>
                    </div>
                  )}
                </td>
                <td>{i.sampleSize}</td>
                <td>{i.defectsFound}</td>
                <td>
                  {(i.nonConformances ?? []).length > 0 ? (
                    <span className="badge-red">{i.nonConformances.length} NCR</span>
                  ) : "—"}
                </td>
                <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.notes ?? "—"}</td>
                <td>
                  <button className="btn-icon" onClick={() => handleDelete(i.id)} title="Delete"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <button className="btn-ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ padding: "7px 14px", fontSize: 13, color: "var(--text-secondary)" }}>Page {page + 1} of {pages}</span>
          <button className="btn-ghost" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {/* ── Add Modal ── */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={() => setShowAdd(false)}>
          <div className="card" style={{ width: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Log Inspection</h3>
              <button className="btn-icon" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Plant *
                <select name="plantId" required style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }}>
                  <option value="">Select plant</option>
                  {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Type
                <select name="inspectionType" style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }}>
                  <option value="INLINE">Inline</option>
                  <option value="FINAL">Final</option>
                  <option value="INCOMING">Incoming</option>
                </select>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Sample Size
                  <input name="sampleSize" type="number" defaultValue={1} min={1} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }} />
                </label>
                <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Defects Found
                  <input name="defectsFound" type="number" defaultValue={0} min={0} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }} />
                </label>
              </div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Result (optional)
                <select name="result" style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", marginTop: 4 }}>
                  <option value="">Pending</option>
                  <option value="PASS">Pass</option>
                  <option value="FAIL">Fail</option>
                  <option value="CONDITIONAL">Conditional</option>
                </select>
              </label>
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Notes
                <textarea name="notes" rows={2} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", resize: "vertical", marginTop: 4 }} />
              </label>
              <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>Log Inspection</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
