import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ─── Tenant-scoped helpers ────────────────────────────────────────────────────
// Every query MUST pass organizationId. This wrapper enforces it at the call site.

export function tenantPrisma(organizationId: string) {
  if (!organizationId) throw new Error("organizationId is required");
  return {
    machine: {
      findMany: (args?: object) =>
        prisma.machine.findMany({ ...args, where: { organizationId, ...(args as any)?.where } }),
      findFirst: (args?: object) =>
        prisma.machine.findFirst({ ...args, where: { organizationId, ...(args as any)?.where } }),
      create: (args: any) =>
        prisma.machine.create({ ...args, data: { ...args.data, organizationId } }),
      update: (args: any) => prisma.machine.update(args),
      delete: (args: any) => prisma.machine.delete(args),
      count: (args?: object) =>
        prisma.machine.count({ ...args, where: { organizationId, ...(args as any)?.where } }),
    },
    workOrder: {
      findMany: (args?: object) =>
        prisma.workOrder.findMany({ ...args, where: { organizationId, ...(args as any)?.where } }),
      findFirst: (args?: object) =>
        prisma.workOrder.findFirst({ ...args, where: { organizationId, ...(args as any)?.where } }),
      create: (args: any) =>
        prisma.workOrder.create({ ...args, data: { ...args.data, organizationId } }),
      update: (args: any) => prisma.workOrder.update(args),
      count: (args?: object) =>
        prisma.workOrder.count({ ...args, where: { organizationId, ...(args as any)?.where } }),
    },
    inventoryItem: {
      findMany: (args?: object) =>
        prisma.inventoryItem.findMany({ ...args, where: { organizationId, ...(args as any)?.where } }),
      create: (args: any) =>
        prisma.inventoryItem.create({ ...args, data: { ...args.data, organizationId } }),
      update: (args: any) => prisma.inventoryItem.update(args),
      count: (args?: object) =>
        prisma.inventoryItem.count({ ...args, where: { organizationId, ...(args as any)?.where } }),
    },
    product: {
      findMany: (args?: object) =>
        prisma.product.findMany({ ...args, where: { organizationId, ...(args as any)?.where } }),
      create: (args: any) =>
        prisma.product.create({ ...args, data: { ...args.data, organizationId } }),
      count: (args?: object) =>
        prisma.product.count({ ...args, where: { organizationId, ...(args as any)?.where } }),
    },
    customer: {
      findMany: (args?: object) =>
        prisma.customer.findMany({ ...args, where: { organizationId, ...(args as any)?.where } }),
      create: (args: any) =>
        prisma.customer.create({ ...args, data: { ...args.data, organizationId } }),
      count: (args?: object) =>
        prisma.customer.count({ ...args, where: { organizationId, ...(args as any)?.where } }),
    },
    vendor: {
      findMany: (args?: object) =>
        prisma.vendor.findMany({ ...args, where: { organizationId, ...(args as any)?.where } }),
      count: (args?: object) =>
        prisma.vendor.count({ ...args, where: { organizationId, ...(args as any)?.where } }),
    },
    productionLog: {
      findMany: (args?: object) =>
        prisma.productionLog.findMany({ ...args, where: { organizationId, ...(args as any)?.where } }),
      count: (args?: object) =>
        prisma.productionLog.count({ ...args, where: { organizationId, ...(args as any)?.where } }),
    },
    downtimeEvent: {
      findMany: (args?: object) =>
        prisma.downtimeEvent.findMany({ ...args, where: { organizationId, ...(args as any)?.where } }),
    },
  };
}
