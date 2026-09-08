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
  UserCog,
  Zap,
  Shield,
} from "lucide-react";
import { Role, ROLES } from "@/lib/roles";

// ─── Navigation Items ──────────────────────────────────────────────────────────

const ALL_NAV_ITEMS = [
  { label: "Dashboard",     href: "/dashboard",     icon: LayoutDashboard, roles: ["SAAS_ADMIN", "ORG_ADMIN", "MEMBER"] },
  { label: "Machines",      href: "/machines",      icon: Cpu,             roles: ["SAAS_ADMIN", "ORG_ADMIN", "MEMBER"] },
  { label: "Inventory",     href: "/inventory",     icon: Package,         roles: ["SAAS_ADMIN", "ORG_ADMIN", "MEMBER"] },
  { label: "Production",    href: "/production",    icon: Factory,         roles: ["SAAS_ADMIN", "ORG_ADMIN", "MEMBER"] },
  { label: "Orders",        href: "/orders",        icon: ClipboardList,   roles: ["SAAS_ADMIN", "ORG_ADMIN", "MEMBER"] },
  { label: "Raw Materials", href: "/raw-materials", icon: Layers,          roles: ["SAAS_ADMIN", "ORG_ADMIN", "MEMBER"] },
  // Admin-only items below
  { label: "Customers",     href: "/customers",     icon: Users,           roles: ["SAAS_ADMIN", "ORG_ADMIN"] },
  { label: "Products",      href: "/products",      icon: ShoppingBag,     roles: ["SAAS_ADMIN", "ORG_ADMIN"] },
  { label: "Vendors",       href: "/vendors",       icon: Truck,           roles: ["SAAS_ADMIN", "ORG_ADMIN"] },
  { label: "Purchase",      href: "/purchase",      icon: ShoppingCart,    roles: ["SAAS_ADMIN", "ORG_ADMIN"] },
  { label: "Members",       href: "/members",       icon: UserCog,         roles: ["SAAS_ADMIN", "ORG_ADMIN"] },
];

const BOTTOM_ITEMS = [
  { label: "Settings",      href: "/settings",      icon: Settings,        roles: ["SAAS_ADMIN", "ORG_ADMIN"] },
];

// ─── Sidebar ───────────────────────────────────────────────────────────────────

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  const visibleNav = ALL_NAV_ITEMS.filter(item => item.roles.includes(role));
  const visibleBottom = BOTTOM_ITEMS.filter(item => item.roles.includes(role));

  const roleBadge = {
    SAAS_ADMIN: { label: "Platform Admin", color: "#f59e0b", bg: "#fef3c7" },
    ORG_ADMIN:  { label: "Admin",          color: "#6366f1", bg: "#ede9fe" },
    MEMBER:     { label: "Member",         color: "#06b6d4", bg: "#cffafe" },
  }[role];

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

      {/* Role Badge */}
      <div style={{ padding: "10px 16px 4px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 99,
            background: roleBadge.bg,
            color: roleBadge.color,
          }}
        >
          {role === ROLES.SAAS_ADMIN && <Shield size={11} />}
          {role === ROLES.ORG_ADMIN && <Zap size={11} />}
          {roleBadge.label}
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
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

        {visibleNav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-link${active ? " active" : ""}`}>
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span>{label}</span>
            </Link>
          );
        })}

        {/* SaaS Admin — Platform Admin section */}
        {role === ROLES.SAAS_ADMIN && (
          <>
            <div
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                color: "#f59e0b", padding: "12px 8px 6px", textTransform: "uppercase",
              }}
            >
              ⚡ Platform
            </div>
            <Link
              href="/saas-admin"
              className={`nav-link${pathname.startsWith("/saas-admin") ? " active" : ""}`}
              style={{ color: "#f59e0b" }}
            >
              <Shield size={17} style={{ flexShrink: 0 }} />
              <span>All Organizations</span>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom */}
      {visibleBottom.length > 0 && (
        <div style={{ padding: "12px 12px", borderTop: "1px solid var(--border-color)" }}>
          {visibleBottom.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-link${pathname === href ? " active" : ""}`}>
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}
