import Sidebar from "@/components/layout/Sidebar";
import PageShell from "@/components/layout/PageShell";
import { requireSaasAdmin } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

export default async function SaasAdminLayout({ children }: { children: React.ReactNode }) {
  await requireSaasAdmin();
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar role={ROLES.SAAS_ADMIN} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <PageShell role={ROLES.SAAS_ADMIN}>{children}</PageShell>
      </div>
    </div>
  );
}
