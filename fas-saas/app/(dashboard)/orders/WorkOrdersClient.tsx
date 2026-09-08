"use client";

import { useState, useTransition } from "react";
import { Plus, Download, Search, Eye, ClipboardEdit, ChevronLeft, ChevronRight, CheckCircle2, Clock, Pause, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { FormField, Select, FormGrid, FormActions, Textarea } from "@/components/ui/FormFields";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

const STATUS_TABS = [
  { label: "All",         value: "" },
  { label: "Queued",      value: "QUEUED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed",   value: "COMPLETED" },
  { label: "On Hold",     value: "ON_HOLD" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    IN_PROGRESS: { cls: "badge badge-cyan",   label: "In Progress" },
    QUEUED:      { cls: "badge badge-yellow",  label: "Pending" },
    COMPLETED:   { cls: "badge badge-green",   label: "Completed" },
    ON_HOLD:     { cls: "badge badge-red",     label: "On Hold" },
  };
  const d = map[status] ?? { cls: "badge badge-gray", label: status };
  return <span className={d.cls}>{d.label}</span>;
}

interface RoutingRow { stepNumber: string; description: string; machineType: string; estimatedHrs: string; }

export default function WorkOrdersClient({ workOrders, products, plants }: { workOrders: any[]; products: any[]; plants: any[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form
  const [productId, setProductId] = useState("");
  const [plantId, setPlantId] = useState(plants[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHrs, setEstimatedHrs] = useState("");
  const [notes, setNotes] = useState("");
  const [routingRows, setRoutingRows] = useState<RoutingRow[]>([
    { stepNumber: "1", description: "", machineType: "", estimatedHrs: "" },
  ]);

  function resetForm() {
    setProductId(""); setQuantity(""); setDueDate(""); setEstimatedHrs(""); setNotes("");
    setRoutingRows([{ stepNumber: "1", description: "", machineType: "", estimatedHrs: "" }]);
    setError("");
  }

  const filtered = workOrders.filter(wo => {
    const matchSearch = (wo.product?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || wo.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !quantity || !dueDate) { setError("Product, Quantity and Due Date are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId, plantId, quantity: parseInt(quantity),
          dueDate, estimatedHrs: parseFloat(estimatedHrs) || undefined,
          notes,
          routingSteps: routingRows
            .filter(r => r.description)
            .map((r, i) => ({
              stepNumber: i + 1,
              description: r.description,
              machineType: r.machineType,
              estimatedHrs: parseFloat(r.estimatedHrs) || undefined,
            })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      resetForm(); setShowCreate(false);
      startTransition(() => router.refresh());
    } catch (err: any) {
      setError(err.message || "Failed.");
    } finally { setSaving(false); }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/work-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Status Filter Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: "1px solid var(--border-color)",
              background: statusFilter === tab.value ? "#6366f1" : "var(--bg-card)",
              color: statusFilter === tab.value ? "white" : "var(--text-secondary)",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {tab.label}
            <span style={{
              marginLeft: 6, fontSize: 11, fontWeight: 700,
              background: statusFilter === tab.value ? "rgba(255,255,255,0.25)" : "var(--bg-page)",
              padding: "1px 6px", borderRadius: 99,
            }}>
              {tab.value ? workOrders.filter(w => w.status === tab.value).length : workOrders.length}
            </span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn-ghost"><Download size={14} /> EXPORT</button>
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="input" style={{ paddingLeft: 32, width: 220, fontSize: 13 }} placeholder="Search orders..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button className="btn-icon" style={{ border: "1px solid var(--border-color)", borderRadius: 8, padding: 6 }}
          onClick={() => { resetForm(); setShowCreate(true); }}>
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
                <th>Product Details</th>
                <th>Quantity</th>
                <th>Machine Details</th>
                <th>Estimate Time</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ width: 120 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No work orders found.</td></tr>
              ) : paginated.map((wo, idx) => (
                <tr key={wo.id}>
                  <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td style={{ fontWeight: 500 }}>{wo.product?.name ?? "—"}</td>
                  <td>{wo.quantity}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{wo.plant?.machines?.[0]?.name ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{wo.estimatedHrs ? `${wo.estimatedHrs} HR.` : "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {new Date(wo.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td><StatusBadge status={wo.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn-icon" title="View detail" onClick={() => setShowDetail(wo)}><Eye size={15} style={{ color: "#06b6d4" }} /></button>
                      {wo.status === "QUEUED" && (
                        <button className="btn-icon" title="Start" onClick={() => updateStatus(wo.id, "IN_PROGRESS")}>
                          <CheckCircle2 size={15} style={{ color: "#22c55e" }} />
                        </button>
                      )}
                      {wo.status === "IN_PROGRESS" && (
                        <>
                          <button className="btn-icon" title="Complete" onClick={() => updateStatus(wo.id, "COMPLETED")}>
                            <CheckCircle2 size={15} style={{ color: "#22c55e" }} />
                          </button>
                          <button className="btn-icon" title="Hold" onClick={() => updateStatus(wo.id, "ON_HOLD")}>
                            <Pause size={15} style={{ color: "#f59e0b" }} />
                          </button>
                        </>
                      )}
                      {wo.status === "ON_HOLD" && (
                        <button className="btn-icon" title="Resume" onClick={() => updateStatus(wo.id, "IN_PROGRESS")}>
                          <Clock size={15} style={{ color: "#8b5cf6" }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "12px 16px", borderTop: "1px solid var(--border-color)" }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <button className="btn-icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ opacity: page === 1 ? 0.4 : 1 }}><ChevronLeft size={16} /></button>
          <button className="btn-icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ opacity: page === totalPages ? 0.4 : 1 }}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Create Work Order Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Work Order" width={640}>
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <FormGrid>
            <FormField label="Product" required>
              <Select value={productId} onChange={e => setProductId(e.target.value)}>
                <option value="">Select product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </Select>
            </FormField>
            <FormField label="Plant">
              <Select value={plantId} onChange={e => setPlantId(e.target.value)}>
                {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </FormField>
          </FormGrid>
          <FormGrid>
            <FormField label="Quantity" required>
              <input className="input" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 100" />
            </FormField>
            <FormField label="Due Date" required>
              <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </FormField>
          </FormGrid>
          <FormField label="Estimated Hours">
            <input className="input" type="number" min="0" step="0.5" value={estimatedHrs} onChange={e => setEstimatedHrs(e.target.value)} placeholder="e.g. 12.5" />
          </FormField>
          <FormField label="Notes">
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
          </FormField>

          {/* Routing Steps */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Routing Steps</label>
              <button type="button" className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}
                onClick={() => setRoutingRows(r => [...r, { stepNumber: String(r.length + 1), description: "", machineType: "", estimatedHrs: "" }])}>
                <Plus size={13} /> Add Step
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {routingRows.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 90px 32px", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, textAlign: "center" }}>{i + 1}</span>
                  <input className="input" value={row.description} onChange={e => setRoutingRows(r => r.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} placeholder="Step description" style={{ fontSize: 13 }} />
                  <input className="input" value={row.machineType} onChange={e => setRoutingRows(r => r.map((x, j) => j === i ? { ...x, machineType: e.target.value } : x))} placeholder="Machine type" style={{ fontSize: 13 }} />
                  <input className="input" type="number" value={row.estimatedHrs} onChange={e => setRoutingRows(r => r.map((x, j) => j === i ? { ...x, estimatedHrs: e.target.value } : x))} placeholder="Hrs" style={{ fontSize: 13 }} />
                  <button type="button" className="btn-icon" onClick={() => setRoutingRows(r => r.filter((_, j) => j !== i))} style={{ color: "#ef4444" }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}
          <FormActions>
            <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Creating..." : "Create Work Order"}</button>
          </FormActions>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={`WO — ${showDetail?.product?.name ?? ""}`} width={580}>
        {showDetail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                ["Product", showDetail.product?.name],
                ["Quantity", showDetail.quantity],
                ["Status", showDetail.status],
                ["Due Date", new Date(showDetail.dueDate).toLocaleDateString()],
                ["Est. Hours", showDetail.estimatedHrs ? `${showDetail.estimatedHrs} hrs` : "—"],
                ["Plant", showDetail.plant?.name],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{k}</div>
                  {k === "Status"
                    ? <StatusBadge status={v as string} />
                    : <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{v}</div>
                  }
                </div>
              ))}
            </div>

            {/* Routing Steps */}
            {showDetail.routingSteps?.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>Routing Steps</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {showDetail.routingSteps.map((step: any) => (
                    <div key={step.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", borderRadius: 8,
                      background: "var(--bg-table-hover)",
                      border: "1px solid var(--border-color)",
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                        background: step.status === "COMPLETED" ? "#22c55e" : step.status === "IN_PROGRESS" ? "#6366f1" : "var(--border-color)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontSize: 12, fontWeight: 700,
                      }}>{step.stepNumber}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{step.description}</div>
                        {step.machineType && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Machine: {step.machineType}</div>}
                      </div>
                      {step.estimatedHrs && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{step.estimatedHrs} hrs</div>}
                      <span className={step.status === "COMPLETED" ? "badge badge-green" : step.status === "IN_PROGRESS" ? "badge badge-cyan" : "badge badge-gray"} style={{ fontSize: 11 }}>
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Status Change */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>Update Status</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["QUEUED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"].map(s => (
                  <button key={s} onClick={() => { updateStatus(showDetail.id, s); setShowDetail((d: any) => ({ ...d, status: s })); }}
                    style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: "1px solid var(--border-color)",
                      background: showDetail.status === s ? "#6366f1" : "var(--bg-card)",
                      color: showDetail.status === s ? "white" : "var(--text-secondary)",
                      cursor: "pointer",
                    }}>
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {showDetail.notes && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>NOTES</div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", background: "var(--bg-page)", padding: "10px 12px", borderRadius: 8 }}>
                  {showDetail.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
