"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import PageShell from "@/components/layout/PageShell";
import { Role } from "@/lib/roles";

export default function DashboardLayoutClient({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar with CSS transitions */}
      <div
        style={{
          width: isSidebarOpen ? 240 : 72,
          minWidth: isSidebarOpen ? 240 : 72,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          borderRight: "1px solid var(--border-color)",
        }}
      >
        <Sidebar role={role} isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", width: "100%" }}>
        <PageShell role={role}>
          {children}
        </PageShell>
      </div>
    </div>
  );
}