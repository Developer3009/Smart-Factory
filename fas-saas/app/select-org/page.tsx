"use client";

import { useOrganizationList } from "@clerk/nextjs";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SelectOrgPage() {
  const router = useRouter();
  const { isLoaded, setActive, userMemberships } = useOrganizationList({ userMemberships: true });

  async function selectOrganization(organizationId: string) {
    await setActive?.({ organization: organizationId });
    router.push("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        gap: 32,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 0 30px rgba(99,102,241,0.4)",
          }}
        >
          <Building2 size={28} color="white" />
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "white",
            margin: 0,
            letterSpacing: "-0.5px",
          }}
        >
          Select Your Organization
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#94a3b8",
            marginTop: 8,
            maxWidth: 340,
          }}
        >
          Choose the factory organization you belong to. You will only see data
          for your selected organization.
        </p>
      </div>

      {/* Only existing memberships are shown. Tenant creation is platform-admin only. */}
      <div style={{ width: "min(100%, 420px)", display: "flex", flexDirection: "column", gap: 10 }}>
        {!isLoaded || userMemberships.isLoading ? (
          <div style={{ color: "#cbd5e1", textAlign: "center", padding: 24 }}>Loading your organizations...</div>
        ) : userMemberships.data?.length ? (
          userMemberships.data.map((membership) => (
            <button
              key={membership.id}
              onClick={() => selectOrganization(membership.organization.id)}
              style={{
                display: "flex", alignItems: "center", gap: 14, width: "100%",
                padding: "16px 18px", borderRadius: 10, textAlign: "left",
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(148,163,184,0.25)",
                color: "white", cursor: "pointer",
              }}
            >
              <Building2 size={18} color="#a5b4fc" />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{membership.organization.name}</span>
              <span style={{ fontSize: 12, color: "#a5b4fc" }}>Open</span>
            </button>
          ))
        ) : (
          <div style={{ color: "#cbd5e1", textAlign: "center", padding: 24 }}>
            You are not assigned to an organization yet. Contact your platform administrator.
          </div>
        )}
      </div>

      {/* Info note */}
      <div
        style={{
          background: "rgba(99,102,241,0.1)",
          border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: 10,
          padding: "12px 20px",
          maxWidth: 380,
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 12, color: "#a5b4fc", margin: 0, lineHeight: 1.6 }}>
          <strong>Organization access:</strong> Your factory data is isolated
          and visible only to members of your selected organization. Contact
          your platform administrator for access changes.
        </p>
      </div>
    </div>
  );
}
