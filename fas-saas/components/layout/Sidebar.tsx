"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cpu,
  Package,
  Factory,
  Users,
  ShoppingBag,
  ClipboardList,
  Truck,
  Layers,
  ShoppingCart,
  Settings,
  Cog,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",     href: "/dashboard",      icon: LayoutDashboard },
  { label: "Machines",      href: "/machines",       icon: Cpu },
  { label: "Inventory",     href: "/inventory",      icon: Package },
  { label: "Production",    href: "/production",     icon: Factory },
  { label: "Customers",     href: "/customers",      icon: Users },
  { label: "Products",      href: "/products",       icon: ShoppingBag },
  { label: "Orders",        href: "/orders",         icon: ClipboardList },
  { label: "Vendors",       href: "/vendors",        icon: Truck },
  { label: "Raw Materials", href: "/raw-materials",  icon: Layers },
  { label: "Purchase",      href: "/purchase",       icon: ShoppingCart },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Cog size={20} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)", lineHeight: 1.2 }}>
            SmartPlant
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.3, marginTop: 1 }}>
            Factory Management System
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            padding: "4px 8px 8px",
            textTransform: "uppercase",
          }}
        >
          Main Menu
        </div>

        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-link${active ? " active" : ""}`}>
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Settings */}
      <div style={{ padding: "12px 12px", borderTop: "1px solid var(--border-color)" }}>
        <Link href="/settings" className="nav-link">
          <Settings size={17} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
