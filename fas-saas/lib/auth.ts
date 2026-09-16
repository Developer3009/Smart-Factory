// ─── Auth Context Helpers ────────────────────────────────────────────────────
// Central place for all authentication + authorization logic.
// All server components and API routes import from here.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { ROLES, Role, clerkOrgRoleToAppRole } from "./roles";

export const DEMO_ORG_ID = ""; // Removed insecure fallback

import { prisma } from "@/lib/prisma";

async function resolveOrganizationId(clerkOrgId: string): Promise<string> {
  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
    select: { id: true },
  });

  if (!organization) {
    throw new Error("Organization is not provisioned");
  }

  return organization.id;
}

export interface AuthContext {
  userId: string;
  orgId: string;       // tenant key — used in every Prisma WHERE clause
  role: Role;          // SAAS_ADMIN | ADMIN | PLANT_MANAGER | SUPERVISOR | OPERATOR | VIEWER | CUSTOMER
  isSaasAdmin: boolean;
  isAdmin: boolean;
  isPlantManager: boolean;
  isSupervisor: boolean;
  isOperator: boolean;
  isViewer: boolean;
  isCustomer: boolean;
  customerId?: string;
  permissions: string[]; // Format: "module:action"
}

// ─── SaaS Admin Detection ─────────────────────────────────────────────────────
// The SaaS admin is identified by their Clerk User ID stored in env vars.
// Set SAAS_ADMIN_CLERK_USER_IDS=user_xxx,user_yyy in .env.local
// This way NO org needed — the platform owner is above all orgs.

function getSaasAdminIds(): string[] {
  const raw = process.env.SAAS_ADMIN_CLERK_USER_IDS ?? "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

function checkIsSaasAdmin(userId: string): boolean {
  return getSaasAdminIds().includes(userId);
}

// ─── Core: Get Auth Context ───────────────────────────────────────────────────

export async function getAuthContext(): Promise<AuthContext> {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) redirect("/sign-in");

  const isSaasAdmin = checkIsSaasAdmin(userId);

  if (isSaasAdmin) {
    return {
      userId,
      orgId: orgId ?? "", // SaaS admin may or may not be in an org
      role: ROLES.SAAS_ADMIN,
      isSaasAdmin: true,
      isAdmin: false,
      isPlantManager: false,
      isSupervisor: false,
      isOperator: false,
      isViewer: false,
      isCustomer: false,
      permissions: ["*"], // SaaS admin has all permissions
    };
  }

  if (!orgId) redirect("/select-org");

  const organizationId = await resolveOrganizationId(orgId);

  // Fetch granular DB roles and permissions
  const orgUser = await prisma.orgUser.findFirst({
    where: { clerkUserId: userId, organizationId },
    include: {
      factoryRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  const permissions = new Set<string>();
  let highestRoleName: string | undefined = undefined;

  const rolePrecedence = [
    ROLES.SAAS_ADMIN,
    ROLES.ADMIN,
    ROLES.PLANT_MANAGER,
    ROLES.SUPERVISOR,
    ROLES.OPERATOR,
    ROLES.VIEWER,
    ROLES.CUSTOMER
  ];

  if (orgUser) {
    let bestIdx = rolePrecedence.length;

    for (const fr of orgUser.factoryRoles) {
      const rName = fr.role.name;
      const idx = rolePrecedence.indexOf(rName as any);
      if (idx !== -1 && idx < bestIdx) {
        bestIdx = idx;
        highestRoleName = rName;
      }

      for (const rp of fr.role.permissions) {
        permissions.add(`${rp.permission.module}:${rp.permission.action}`);
      }
    }
  }

  let finalRole = clerkOrgRoleToAppRole(orgRole ?? undefined);
  const isCustomer = !!orgUser?.customerId;

  if (highestRoleName) {
    finalRole = highestRoleName as Role;
  } else if (isCustomer) {
    finalRole = ROLES.CUSTOMER;
  }

  return {
    userId,
    orgId: organizationId,
    role: finalRole,
    isSaasAdmin: false,
    isAdmin: finalRole === ROLES.ADMIN,
    isPlantManager: finalRole === ROLES.PLANT_MANAGER,
    isSupervisor: finalRole === ROLES.SUPERVISOR,
    isOperator: finalRole === ROLES.OPERATOR,
    isViewer: finalRole === ROLES.VIEWER,
    isCustomer: finalRole === ROLES.CUSTOMER || isCustomer,
    customerId: orgUser?.customerId || undefined,
    permissions: Array.from(permissions),
  };
}

// ─── Route Guards ─────────────────────────────────────────────────────────────

/**
 * Require a specific granular permission from the database.
 * Used by mutating endpoints (e.g. POST, PUT, DELETE) and sensitive GET routes.
 */
export async function requirePermission(module: string, action: string): Promise<AuthContext> {
  const ctx = await getAuthContext();
  
  if (ctx.isSaasAdmin) return ctx; // SaaS admins bypass permission checks
  
  const permKey = `${module}:${action}`;
  if (!ctx.permissions.includes(permKey) && !ctx.permissions.includes("*")) {
    redirect("/unauthorized");
  }
  
  return ctx;
}

/**
 * Legacy: Use at the top of any Server Component page that requires specific roles.
 * Redirects to /unauthorized if the user's role is not in `allowedRoles`.
 */
export async function requireRole(allowedRoles: Role[]): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!allowedRoles.includes(ctx.role)) {
    redirect("/unauthorized");
  }
  return ctx;
}

/**
 * Shorthand: require the caller to be the SaaS platform admin.
 * Used in /saas-admin/* routes and /api/saas/* routes.
 */
export async function requireSaasAdmin(): Promise<AuthContext> {
  return requireRole([ROLES.SAAS_ADMIN]);
}

/**
 * Shorthand: require admin or above.
 * Used in Server Component pages (redirects on failure).
 */
export async function requireAdmin(): Promise<AuthContext> {
  return requireRole([ROLES.ADMIN, ROLES.SAAS_ADMIN]);
}

/**
 * API-route guard: require ADMIN or SAAS_ADMIN.
 * Returns a 403 NextResponse when the check fails.
 */
export async function requireAdminOrAbove(): Promise<AuthContext | NextResponse> {
  try {
    const ctx = await getAuthContext();
    if (ctx.role !== ROLES.ADMIN && ctx.role !== ROLES.SAAS_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return ctx;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// ─── Tenant-Aware Org ID ──────────────────────────────────────────────────────

/**
 * Server-side: returns the current org ID from Clerk JWT.
 * SaaS admin: returns their active org or DEMO_ORG_ID.
 * Throws an error or redirects if auth fails.
 */
export async function getCurrentOrgId(): Promise<string> {
  const { orgId, userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (orgId) return resolveOrganizationId(orgId);
  
  throw new Error("Unauthorized: No organization selected");
}

/** Synchronous fallback — use only in client-side code */
export function getCurrentOrgIdSync(): string {
  throw new Error("getCurrentOrgIdSync is insecure for tenant scoping. Use Clerk's useAuth() on the client.");
}

