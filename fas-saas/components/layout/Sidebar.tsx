"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Cpu, Package, Factory, Users, ShoppingBag,
  ClipboardList, Truck, Layers, ShoppingCart, Settings, Cog,
  UserCog, Zap, Shield, Building2, Globe,
  ClipboardCheck, Wrench, CalendarDays, TestTube,
} from "lucide-react";
import { Role, ROLES } from "@/lib/roles";

// ─── Navigation Matrix ─────────────────────────────────────────────────────────
//
// SAAS_ADMIN: Platform service provider
//   ✅ Dashboard, Members (read all orgs), All Organizations, Settings
//   ❌ NOT shown: Production-ops menus (those belong to the factory org)
//
// ORG_ADMIN: Factory/organization admin
//   ✅ Dashboard, Machines, Inventory, Production, Orders, Raw Materials,
//      Customers, Products, Vendors, Purchase, Members, Settings
//
// MEMBER: Factory employee/operator
//   ✅ Dashboard, Machines, Inventory, Production, Orders, Raw Materials
//   ❌ NOT shown: Customers, Products, Vendors, Purchase, Members, Settings

// ── Section 1: Overview (all roles)
const OVERVIEW_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SAAS_ADMIN", "ORG_ADMIN", "MEMBER"] },
];

// ── Section 2: Factory Operations (ORG_ADMIN + MEMBER)
const OPS_NAV = [
  { label: "Machines",      href: "/machines",      icon: Cpu,           roles: ["ORG_ADMIN", "MEMBER"] },
  { label: "Production",    href: "/production",    icon: Factory,       roles: ["ORG_ADMIN", "MEMBER"] },
  { label: "Inventory",     href: "/inventory",     icon: Package,       roles: ["ORG_ADMIN", "MEMBER"] },
  { label: "Raw Materials", href: "/raw-materials", icon: Layers,        roles: ["ORG_ADMIN", "MEMBER"] },
  { label: "Orders",          href: "/orders",       icon: ClipboardList,  roles: ["ORG_ADMIN", "MEMBER"] },
  { label: "Quality Control", href: "/qc",           icon: ClipboardCheck, roles: ["ORG_ADMIN", "MEMBER"] },
  { label: "Maintenance",     href: "/maintenance",  icon: Wrench,         roles: ["ORG_ADMIN", "MEMBER"] },
  { label: "Shifts",          href: "/shifts",       icon: CalendarDays,   roles: ["ORG_ADMIN"] },
];

// ── Section 3: Admin Business Tools (ORG_ADMIN only)
const ADMIN_NAV = [
  { label: "Customers", href: "/customers", icon: Users,        roles: ["ORG_ADMIN"] },
  { label: "Products",  href: "/products",  icon: ShoppingBag,  roles: ["ORG_ADMIN"] },
  { label: "Vendors",   href: "/vendors",   icon: Truck,        roles: ["ORG_ADMIN"] },
  { label: "Purchase",  href: "/purchase",  icon: ShoppingCart, roles: ["ORG_ADMIN"] },
];

// ── Section 4: People & Settings (ORG_ADMIN + SAAS_ADMIN)
const PEOPLE_NAV = [
  { label: "Members",  href: "/members",  icon: UserCog, roles: ["SAAS_ADMIN", "ORG_ADMIN"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["SAAS_ADMIN", "ORG_ADMIN"] },
];

// ─── Sidebar ───────────────────────────────────────────────────────────────────

function NavSection({ title, items, role, pathname, titleColor }: {
  title: string;
  items: typeof OPS_NAV;
  role: Role;
  pathname: string;
  titleColor?: string;
}) {
  const visible = items.filter(item => item.roles.includes(role));
  if (visible.length === 0) return null;
  return (
    <>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
        color: titleColor ?? "var(--text-muted)",
        padding: "10px 8px 6px", textTransform: "uppercase",
      }}>
        {title}
      </div>
      {visible.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`nav-link${active ? " active" : ""}`}
            style={titleColor ? { color: active ? "white" : titleColor } : undefined}
          >
            <Icon size={17} style={{ flexShrink: 0 }} />
            <span>{label}</span>
          </Link>
        );
      })}
    </>
  );
}

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  const roleBadge = {
    SAAS_ADMIN: { label: "SaaS Admin",    color: "#f59e0b", bg: "#fef3c7" },
    ORG_ADMIN:  { label: "Organization Admin", color: "#6366f1", bg: "#ede9fe" },
    MEMBER:     { label: "Employee",       color: "#06b6d4", bg: "#cffafe" },
  }[role];

  return (
    <aside style={{
      width: 240, minWidth: 240,
      background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border-color)",
      display: "flex", flexDirection: "column",
      height: "100vh", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{
        padding: "20px 20px 16px",
        borderBottom: "1px solid var(--border-color)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 8,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
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
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
          background: roleBadge.bg, color: roleBadge.color,
        }}>
          {role === ROLES.SAAS_ADMIN && <Shield size={11} />}
          {role === ROLES.ORG_ADMIN  && <Zap size={11} />}
          {role === ROLES.MEMBER     && <UserCog size={11} />}
          {roleBadge.label}
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>

        {/* Overview — all roles */}
        <NavSection title="Overview" items={OVERVIEW_NAV} role={role} pathname={pathname} />

        {/* SaaS Admin — Platform section */}
        {role === ROLES.SAAS_ADMIN && (
          <>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              color: "#f59e0b", padding: "10px 8px 6px", textTransform: "uppercase",
            }}>
              ⚡ Platform
            </div>
            <Link
              href="/saas-admin"
              className={`nav-link${pathname === "/saas-admin" ? " active" : ""}`}
            >
              <Globe size={17} style={{ flexShrink: 0 }} />
              <span>All Organizations</span>
            </Link>
            <Link
              href="/saas-admin/members"
              className={`nav-link${pathname.startsWith("/saas-admin/members") ? " active" : ""}`}
            >
              <Users size={17} style={{ flexShrink: 0 }} />
              <span>All Members</span>
            </Link>
          </>
        )}

        {/* Factory Operations — ORG_ADMIN + MEMBER */}
        {role !== ROLES.SAAS_ADMIN && (
          <NavSection title="Factory Operations" items={OPS_NAV} role={role} pathname={pathname} />
        )}

        {/* Admin Business Tools — ORG_ADMIN only */}
        {role === ROLES.ORG_ADMIN && (
          <NavSection title="Business" items={ADMIN_NAV} role={role} pathname={pathname} />
        )}

        {/* People & Settings — ORG_ADMIN only (SAAS_ADMIN has platform section above) */}
        {role === ROLES.ORG_ADMIN && (
          <NavSection title="Organization" items={PEOPLE_NAV} role={role} pathname={pathname} />
        )}

      </nav>

      {/* Bottom: Settings for SaaS Admin */}
      {role === ROLES.SAAS_ADMIN && (
        <div style={{ padding: "12px 12px", borderTop: "1px solid var(--border-color)" }}>
          <Link
            href="/settings"
            className={`nav-link${pathname === "/settings" ? " active" : ""}`}
          >
            <Settings size={17} />
            <span>Settings</span>
          </Link>
        </div>
      )}
    </aside>
  );
}


