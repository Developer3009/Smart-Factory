// ─── Auth Context Helpers ────────────────────────────────────────────────────
// Central place for all authentication + authorization logic.
// All server components and API routes import from here.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ROLES, Role, clerkOrgRoleToAppRole } from "./roles";

export const DEMO_ORG_ID = "demo-org-1";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthContext {
  userId: string;
  orgId: string;       // tenant key — used in every Prisma WHERE clause
  role: Role;          // SAAS_ADMIN | ORG_ADMIN | MEMBER
  isSaasAdmin: boolean;
  isOrgAdmin: boolean;
  isMember: boolean;
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

/**
 * Returns the full auth context for the current request.
 * Use this in server components and API routes.
 *
 * How it maps to PostgreSQL:
 *   - isSaasAdmin=true  → queries run WITHOUT organizationId filter (sees all rows)
 *   - isOrgAdmin=true   → queries filter by orgId (only their org's rows)
 *   - isMember=true     → same DB filter as admin, but UI hides sensitive data
 */
export async function getAuthContext(): Promise<AuthContext> {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) redirect("/sign-in");

  const isSaasAdmin = checkIsSaasAdmin(userId);

  if (isSaasAdmin) {
    return {
      userId,
      orgId: orgId ?? DEMO_ORG_ID, // SaaS admin may or may not be in an org
      role: ROLES.SAAS_ADMIN,
      isSaasAdmin: true,
      isOrgAdmin: false,
      isMember: false,
    };
  }

  // Regular user — must belong to an org
  if (!orgId) redirect("/sign-in"); // no org selected yet

  const role = clerkOrgRoleToAppRole(orgRole ?? undefined);

  return {
    userId,
    orgId,
    role,
    isSaasAdmin: false,
    isOrgAdmin: role === ROLES.ORG_ADMIN,
    isMember: role === ROLES.MEMBER,
  };
}

// ─── Route Guards ─────────────────────────────────────────────────────────────

/**
 * Use at the top of any Server Component page that requires specific roles.
 * Redirects to /unauthorized if the user's role is not in `allowedRoles`.
 *
 * Example:
 *   const ctx = await requireRole(["ORG_ADMIN", "SAAS_ADMIN"]);
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
 * Shorthand: require org admin or above.
 * Used on settings, user management, customers, vendors, etc.
 */
export async function requireOrgAdmin(): Promise<AuthContext> {
  return requireRole([ROLES.ORG_ADMIN, ROLES.SAAS_ADMIN]);
}

// ─── Tenant-Aware Org ID ──────────────────────────────────────────────────────

/**
 * Server-side: returns the current org ID from Clerk JWT.
 * SaaS admin: returns their active org or DEMO_ORG_ID.
 * Falls back to env var for local dev without Clerk session.
 */
export async function getCurrentOrgId(): Promise<string> {
  try {
    const { orgId, userId } = await auth();
    if (userId && checkIsSaasAdmin(userId)) {
      // SaaS admin: for API routes, they pass ?orgId= query param
      // Otherwise return demo org so dashboard doesn't crash
      return orgId ?? process.env.NEXT_PUBLIC_ORG_ID ?? DEMO_ORG_ID;
    }
    if (orgId) return orgId;
    if (userId) return userId; // solo user fallback
  } catch {
    // Outside Clerk context (seed scripts, etc.)
  }
  return process.env.NEXT_PUBLIC_ORG_ID ?? DEMO_ORG_ID;
}

/** Synchronous fallback — use only in client-side code */
export function getCurrentOrgIdSync(): string {
  return process.env.NEXT_PUBLIC_ORG_ID ?? DEMO_ORG_ID;
}
