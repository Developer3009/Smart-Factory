// ─── Role Definitions ────────────────────────────────────────────────────────

export const ROLES = {
  SAAS_ADMIN:    "SAAS_ADMIN",    // Platform owner
  ADMIN:         "ADMIN",         // Org owner / Factory Director
  PLANT_MANAGER: "PLANT_MANAGER", // Plant-level manager
  SUPERVISOR:    "SUPERVISOR",    // Line/Shift supervisor
  OPERATOR:      "OPERATOR",      // Shop-floor worker
  VIEWER:        "VIEWER",        // Read-only access
  CUSTOMER:      "CUSTOMER",      // Customer portal user
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Clerk org roles map to our baseline roles:
// org:admin  → ADMIN
// org:member → VIEWER (least privilege by default, DB roles will override this in getAuthContext)
export function clerkOrgRoleToAppRole(clerkRole: string | undefined): Role {
  if (clerkRole === "org:admin") return ROLES.ADMIN;
  return ROLES.VIEWER; 
}

// Basic Route Guards based on roles
export const SAAS_ADMIN_ROUTES = ["/saas-admin"];

// Routes that only managers and above can access
export const ADMIN_ONLY_ROUTES = [
  "/customers",
  "/vendors",
  "/products",
  "/purchase",
  "/members",
  "/settings",
];
