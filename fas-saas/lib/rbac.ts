/**
 * lib/rbac.ts
 * Granular RBAC: module × action permissions scoped per factory.
 * 
 * Usage in API routes:
 *   const ctx = await getAuthContext();
 *   await requirePermission(ctx.userId, factoryId, "production", "edit");
 */
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

export type PermissionModule =
  | "production" | "inventory" | "machines" | "maintenance"
  | "qc" | "purchase" | "members" | "reports" | "settings" | "billing";

export type PermissionAction =
  | "view" | "edit" | "delete" | "approve"
  | "inspect" | "flag" | "status_change" | "create" | "close" | "invite" | "remove";

// ─── Check a single permission ───────────────────────────────────────────────
export async function checkPermission(
  userId: string,
  factoryId: string,
  module: PermissionModule,
  action: PermissionAction
): Promise<boolean> {
  try {
    const count = await prisma.userFactoryRole.count({
      where: {
        userId,
        factoryId,
        role: {
          permissions: {
            some: {
              permission: { module, action },
            },
          },
        },
      },
    });
    return count > 0;
  } catch {
    return false;
  }
}

// ─── Require permission — redirects to /unauthorized if denied ───────────────
export async function requirePermission(
  userId: string,
  factoryId: string,
  module: PermissionModule,
  action: PermissionAction
): Promise<void> {
  const allowed = await checkPermission(userId, factoryId, module, action);
  if (!allowed) redirect("/unauthorized");
}

// ─── Get all permissions for a user in a factory ────────────────────────────
export async function getUserPermissions(
  userId: string,
  factoryId: string
): Promise<Array<{ module: string; action: string }>> {
  const rows = await prisma.userFactoryRole.findMany({
    where: { userId, factoryId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });
  const perms = new Map<string, { module: string; action: string }>();
  for (const ufr of rows) {
    for (const rp of ufr.role.permissions) {
      const key = rp.permission.module + ":" + rp.permission.action;
      perms.set(key, { module: rp.permission.module, action: rp.permission.action });
    }
  }
  return Array.from(perms.values());
}

// ─── Seed data: default system roles and permissions ─────────────────────────
export const SYSTEM_ROLES = [
  { name: "Plant Manager",         perms: ["production:view","production:edit","production:approve","inventory:view","inventory:edit","machines:view","machines:status_change","maintenance:view","maintenance:create","qc:view","qc:inspect","members:view","reports:view","settings:view"] },
  { name: "Production Supervisor", perms: ["production:view","production:edit","inventory:view","machines:view","machines:status_change","qc:view","reports:view"] },
  { name: "Machine Operator",      perms: ["production:view","machines:view","machines:status_change","qc:view"] },
  { name: "QC Inspector",          perms: ["qc:view","qc:inspect","qc:flag","production:view","reports:view"] },
  { name: "Maintenance Engineer",  perms: ["maintenance:view","maintenance:create","maintenance:close","machines:view","machines:status_change","reports:view"] },
  { name: "Inventory Manager",     perms: ["inventory:view","inventory:edit","inventory:delete","reports:view"] },
  { name: "Procurement Officer",   perms: ["purchase:view","purchase:create","purchase:approve","inventory:view"] },
  { name: "Finance",               perms: ["reports:view","billing:view"] },
  { name: "Viewer",                perms: ["production:view","inventory:view","machines:view","qc:view","reports:view"] },
] as const;
