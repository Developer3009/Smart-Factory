"use client";

import { useState } from "react";
import { Download, Plus, Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

export default function MachinesClient({ machines }: { machines: any[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = machines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.machineType.toLowerCase().includes(search.toLowerCase()) ||
    (m.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      RUNNING: "badge badge-green",
      IDLE:    "badge badge-yellow",
      DOWN:    "badge badge-red",
    };
    const label: Record<string, string> = { RUNNING: "Active", IDLE: "Idle", DOWN: "Down" };
    return <span className={map[status] ?? "badge badge-gray"}>{label[status] ?? status}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Controls */}
      <div className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn-ghost">
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
        <button className="btn-icon" style={{ border: "1px solid var(--border-color)", borderRadius: 8, padding: 6 }}>
          <Plus size={18} />
        </button>
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
                      <button className="btn-icon" title="View details">
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
    </div>
  );
}
