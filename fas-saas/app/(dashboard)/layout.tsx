import Sidebar from "@/components/layout/Sidebar";
import PageShell from "@/components/layout/PageShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <PageShell>{children}</PageShell>
      </div>
    </div>
  );
}
