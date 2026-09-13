"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Factory, Lock } from "lucide-react";

export default function WorkerLoginClient({ organizations }: { organizations: { id: string; name: string }[] }) {
  const router = useRouter();
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleKey(k: string) {
    if (k === "DEL") { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 6) return;
    setPin(p => p + k);
  }

  async function handleSubmit() {
    if (pin.length < 4) { setError("Enter at least 4 digits"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/worker-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, organizationId: orgId }),
      });
      const data = await res.json();
      if (res.ok) { router.push("/worker/tasks"); }
      else { setError(data.error ?? "Invalid PIN"); setPin(""); }
    } catch { setError("Network error. Try again."); }
    setLoading(false);
  }

  const keys = ["1","2","3","4","5","6","7","8","9","DEL","0","OK"];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}>
          <Factory size={36} color="white" />
        </div>
        <h1 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: 0 }}>Worker Login</h1>
        <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Enter your PIN to clock in</p>
      </div>

      {/* Card */}
      <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 360 }}>
        {/* Org selector */}
        {organizations.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, display: "block" }}>Select Organization</label>
            <select value={orgId} onChange={e => setOrgId(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: 14 }}>
              {organizations.map(o => <option key={o.id} value={o.id} style={{ background: "#1e1b4b" }}>{o.name}</option>)}
            </select>
          </div>
        )}

        {/* PIN display */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24 }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ width: 40, height: 48, borderRadius: 10, border: `2px solid ${pin.length > i ? "#6366f1" : "rgba(255,255,255,0.2)"}`, background: pin.length > i ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
              {pin.length > i ? <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#6366f1" }} /> : null}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 16 }}>{error}</p>}

        {/* Keypad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {keys.map(k => (
            <button key={k} onClick={() => k === "OK" ? handleSubmit() : handleKey(k)}
              disabled={loading}
              style={{
                padding: "16px 0", borderRadius: 12, fontSize: k === "DEL" || k === "OK" ? 13 : 20, fontWeight: 700,
                background: k === "OK" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : k === "DEL" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
                color: k === "OK" ? "white" : k === "DEL" ? "#ef4444" : "white",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer", transition: "all 0.1s",
              }}>
              {k}
            </button>
          ))}
        </div>

        <p style={{ color: "#475569", fontSize: 11, textAlign: "center", marginTop: 20 }}>
          <Lock size={11} style={{ display: "inline", marginRight: 4 }} />
          Session expires after 30 minutes of inactivity
        </p>
      </div>
    </div>
  );
}
