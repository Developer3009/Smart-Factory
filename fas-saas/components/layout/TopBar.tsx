"use client";

import { useState, useEffect } from "react";
import { Search, Sun, Moon, Settings, Bell } from "lucide-react";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { Role, ROLES } from "@/lib/roles";

export default function TopBar({ title, subtitle, role }: { title: string; subtitle?: string; role?: Role }) {
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") { document.documentElement.classList.add("dark"); setDark(true); }
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
      <div style={{ flex: 1, maxWidth: 340, position: "relative" }}>
        <Search
          size={15}
          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
        />
        <input
          className="input"
          style={{ width: "100%", paddingLeft: 32, fontSize: 13 }}
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Right: Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Org Switcher — shows org name, lets user switch between orgs */}
        <OrganizationSwitcher
          hidePersonal
          afterSelectOrganizationUrl="/dashboard"
          afterCreateOrganizationUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: { display: "flex", alignItems: "center" },
              organizationSwitcherTrigger: {
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
              },
            },
          }}
        />

        <button className="btn-icon" title="Settings">
          <Settings size={17} />
        </button>
        <button className="btn-icon" title={dark ? "Light mode" : "Dark mode"} onClick={toggleTheme}>
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="btn-icon" title="Notifications">
          <Bell size={17} />
        </button>

        {/* Clerk UserButton — profile photo, sign out, user settings */}
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
