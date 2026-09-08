"use client";

import { usePathname } from "next/navigation";
import TopBar from "./TopBar";
import { Role, ROLES } from "@/lib/roles";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":    { title: "Dashboard",    subtitle: "Overview of your factory operations" },
  "/machines":     { title: "Machines",     subtitle: "Machine status and management" },
  "/inventory":    { title: "Inventory",    subtitle: "Stock levels and movements" },
  "/production":   { title: "Production",   subtitle: "Work order tracking" },
  "/customers":    { title: "Customers",    subtitle: "Customer accounts" },
  "/products":     { title: "Products",     subtitle: "Product catalog and BOM" },
  "/orders":       { title: "Orders",       subtitle: "Work orders and job management" },
  "/vendors":      { title: "Vendors",      subtitle: "Supplier management" },
  "/raw-materials":{ title: "Raw Materials",subtitle: "Raw material inventory" },
  "/purchase":     { title: "Purchase",     subtitle: "Purchase orders" },
  "/members":      { title: "Members",      subtitle: "Team members and roles" },
  "/settings":     { title: "Settings",     subtitle: "Organization settings" },
  "/saas-admin":   { title: "Platform Admin",subtitle: "All organizations overview" },
  "/saas-admin/organizations": { title: "All Organizations", subtitle: "SaaS platform management" },
};

export default function PageShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
  const pathname = usePathname();
  const page = pageTitles[pathname] ?? { title: "Dashboard", subtitle: "FMS Admin Dashboard Solution" };

  return (
    <>
      <TopBar title={page.title} subtitle={page.subtitle} role={role} />
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 28px",
          background: "var(--bg-page)",
        }}
      >
        {children}
      </main>
    </>
  );
}
