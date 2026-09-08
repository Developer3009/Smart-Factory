import Sidebar from "@/components/layout/Sidebar";
import PageShell from "@/components/layout/PageShell";
import { getAuthContext } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side: read role from Clerk JWT — no DB call needed
  const { role } = await getAuthContext();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Pass role to Sidebar — it filters nav items accordingly */}
      <Sidebar role={role} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <PageShell role={role}>{children}</PageShell>
      </div>
    </div>
  );
}
