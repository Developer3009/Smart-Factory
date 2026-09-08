import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", gap: 20, padding: 32,
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <ShieldX size={36} style={{ color: "#ef4444" }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "white", marginBottom: 8 }}>Access Denied</h1>
        <p style={{ fontSize: 15, color: "#94a3b8", maxWidth: 380, lineHeight: 1.6 }}>
          You don&apos;t have permission to view this page. This area requires a higher role level.
        </p>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/dashboard" style={{
          padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
          background: "#6366f1", color: "white", textDecoration: "none",
        }}>
          Go to Dashboard
        </Link>
        <Link href="/sign-in" style={{
          padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
          background: "rgba(255,255,255,0.08)", color: "#94a3b8", textDecoration: "none",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          Sign in with another account
        </Link>
      </div>
    </div>
  );
}
