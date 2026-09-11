"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Sun, Moon, Bell, X } from "lucide-react";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { Role, ROLES } from "@/lib/roles";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SEARCH_ITEMS = [
  { label: "Dashboard",     href: "/dashboard",     keywords: "home overview stats" },
  { label: "Machines",      href: "/machines",      keywords: "cnc lathe milling equipment device" },
  { label: "Production",    href: "/production",    keywords: "manufacturing output work" },
  { label: "Inventory",     href: "/inventory",     keywords: "stock items warehouse storage" },
  { label: "Raw Materials", href: "/raw-materials", keywords: "raw material component supply" },
  { label: "Orders",        href: "/orders",        keywords: "work order schedule queue" },
  { label: "Customers",     href: "/customers",     keywords: "client buyer company" },
  { label: "Products",      href: "/products",      keywords: "product bom bill of materials" },
  { label: "Vendors",       href: "/vendors",       keywords: "supplier vendor provider" },
  { label: "Purchase",      href: "/purchase",      keywords: "purchase order buy procurement" },
  { label: "Members",       href: "/members",       keywords: "team employee user member staff" },
  { label: "Settings",      href: "/settings",      keywords: "config preferences organization" },
];

export default function TopBar({ title, subtitle, role }: { title: string; subtitle?: string; role?: Role }) {
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") { document.documentElement.classList.add("dark"); setDark(true); }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDark(!dark);
  };

  const filtered = search.trim()
    ? SEARCH_ITEMS.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.keywords.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  function handleSelect(href: string) {
    setSearch("");
    setShowResults(false);
    router.push(href);
  }

  // Keyboard shortcut: Ctrl+K opens search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const input = searchRef.current?.querySelector("input");
        input?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header
      style={{
        background: "var(--bg-topbar)",
        borderBottom: "1px solid var(--border-color)",
        padding: "0 28px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexShrink: 0,
      }}
    >
      {/* Left: Title */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{subtitle}</p>
        )}
      </div>

      {/* Center: Search */}
      <div ref={searchRef} style={{ flex: 1, maxWidth: 380, position: "relative" }}>
        <Search
          size={15}
          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", zIndex: 2 }}
        />
        <input
          className="input"
          style={{ width: "100%", paddingLeft: 32, paddingRight: 60, fontSize: 13 }}
          placeholder="Search pages... (Ctrl+K)"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
        />
        {/* Keyboard shortcut badge */}
        <span style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          fontSize: 10, fontWeight: 600, color: "var(--text-muted)",
          background: "var(--bg-page)", border: "1px solid var(--border-color)",
          padding: "2px 6px", borderRadius: 4,
        }}>
          Ctrl+K
        </span>

        {/* Search Results Dropdown */}
        {showResults && search.trim() && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            background: "var(--bg-card)", border: "1px solid var(--border-color)",
            borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            zIndex: 100, maxHeight: 300, overflowY: "auto",
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No results for "{search}"
              </div>
            ) : (
              filtered.map(item => (
                <button
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "10px 16px", background: "none", border: "none",
                    cursor: "pointer", color: "var(--text-primary)",
                    fontSize: 14, fontWeight: 500, textAlign: "left",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-page)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  {item.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <OrganizationSwitcher
          hidePersonal
          afterSelectOrganizationUrl="/dashboard"
          afterCreateOrganizationUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: { display: "flex", alignItems: "center" },
              organizationSwitcherTrigger: {
                padding: "6px 10px", borderRadius: 8,
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)", fontSize: 13,
                fontWeight: 600, color: "var(--text-primary)",
              },
              ...(role !== ROLES.SAAS_ADMIN && {
                organizationListCreateOrganizationActionButton: { display: "none" },
                organizationSwitcherPopoverActionButton__createOrganization: { display: "none" },
              }),
            },
          }}
        />

        <button className="btn-icon" title={dark ? "Light mode" : "Dark mode"} onClick={toggleTheme}>
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="btn-icon" title="Notifications">
          <Bell size={17} />
        </button>

        <UserButton
          appearance={{
            elements: {
              avatarBox: { width: 34, height: 34, borderRadius: "50%" },
            },
          }}
        />
      </div>
    </header>
  );
}
