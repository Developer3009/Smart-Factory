"use client";

import { usePathname } from "next/navigation";
import TopBar from "./TopBar";

const pageTitles: Record<string, string> = {
  "/dashboard":    "Dashboard",
  "/machines":     "Machines",
  "/inventory":    "Inventory",
  "/production":   "Production",
  "/customers":    "Customers",
  "/products":     "Products",
  "/orders":       "Orders",
  "/vendors":      "Vendors",
  "/raw-materials":"Raw Materials",
  "/purchase":     "Purchase",
  "/settings":     "Settings",
};

export default function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Dashboard";

  return (
    <>
      <TopBar title={title} subtitle="FMS Admin Dashboard Solution" />
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
