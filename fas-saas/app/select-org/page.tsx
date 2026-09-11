import { OrganizationList } from "@clerk/nextjs";
import { Building2 } from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

export default async function SelectOrgPage() {
  const { role } = await getAuthContext();
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

      {/* Clerk OrganizationList — shows all orgs the user is a member of */}
      <OrganizationList
        hidePersonal
        afterSelectOrganizationUrl="/dashboard"
        afterCreateOrganizationUrl="/dashboard"
        appearance={{
          elements: {
            ...(role !== ROLES.SAAS_ADMIN && {
              organizationListCreateOrganizationActionButton: { display: "none" },
            }),
          }
        }}
      />

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
          🔒 <strong>Multi-tenant SaaS:</strong> Each organization's data is
          completely isolated. Your factory data is only visible to members of
          your organization.
        </p>
      </div>
    </div>
  );
}
