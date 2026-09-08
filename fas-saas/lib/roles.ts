// ─── Role Definitions ────────────────────────────────────────────────────────
// Three tiers in this SaaS:
//   SAAS_ADMIN  → platform owner (you) — sees all organizations
//   ORG_ADMIN   → factory owner/manager — sees their org in full
//   MEMBER      → operator/shop-floor staff — limited read-only view

export const ROLES = {
  SAAS_ADMIN: "SAAS_ADMIN",
  ORG_ADMIN:  "ORG_ADMIN",
  MEMBER:     "MEMBER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Clerk org roles map to our roles:
//   org:admin  → ORG_ADMIN
//   org:member → MEMBER
export function clerkOrgRoleToAppRole(clerkRole: string | undefined): Role {
  if (clerkRole === "org:admin") return ROLES.ORG_ADMIN;
  return ROLES.MEMBER; // default — least privilege
}

// Navigation items each role can see
export const MEMBER_HIDDEN_ROUTES = [
  "/customers",
  "/vendors",
  "/products",
  "/purchase",
  "/members",
  "/settings",
];

// Routes only org admin or above can access
export const ORG_ADMIN_ONLY_ROUTES = [
  "/customers",
  "/vendors",
  "/products",
  "/purchase",
  "/members",
  "/settings",
];

// Routes only saas admin can access
export const SAAS_ADMIN_ROUTES = ["/saas-admin"];
