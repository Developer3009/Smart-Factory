import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

async function getStats(organizationId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  try {
    const [orders, products, customers, machines, inventory, rawMaterials, employees, workOrders] =
      await Promise.all([
        prisma.workOrder.count({ where: { organizationId } }),
        prisma.product.count({ where: { organizationId } }),
        prisma.customer.count({ where: { organizationId } }),
        prisma.machine.count({ where: { organizationId } }),
        prisma.inventoryItem.count({ where: { organizationId, type: "FINISHED_GOOD" } }),
        prisma.inventoryItem.count({ where: { organizationId, type: "RAW_MATERIAL" } }),
        prisma.orgUser.count({ where: { organizationId } }),
        prisma.workOrder.findMany({
          where: {
            organizationId,
            status: { in: ["QUEUED", "IN_PROGRESS"] },
            dueDate: { gte: startOfToday, lt: startOfTomorrow },
          },
          include: { product: true, plant: { include: { machines: { take: 1 } } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);

    // Calculate profit from sales orders (stub for now)
    const salesOrders = await prisma.salesOrder.findMany({
      where: { customer: { organizationId } },
    });
    const totalProfit = salesOrders.reduce((sum, o) => sum + o.amount, 0);

    const [pending, inProgress, completed] = await Promise.all([
      prisma.workOrder.count({ where: { organizationId, status: "QUEUED", dueDate: { gte: startOfToday, lt: startOfTomorrow } } }),
      prisma.workOrder.count({ where: { organizationId, status: "IN_PROGRESS", dueDate: { gte: startOfToday, lt: startOfTomorrow } } }),
      prisma.workOrder.count({ where: { organizationId, status: "COMPLETED", dueDate: { gte: startOfToday, lt: startOfTomorrow } } }),
    ]);
    const total = pending + inProgress + completed;

    return {
      orders,
      totalProfit,
      products,
      customers,
      inventory,
      rawMaterials,
      employees,
      machines,
      workOrders,
      productionStatus: {
        pending,
        inProgress,
        completed,
        total,
        pendingPct: total ? ((pending / total) * 100).toFixed(2) : "0.00",
        inProgressPct: total ? ((inProgress / total) * 100).toFixed(2) : "0.00",
        completedPct: total ? ((completed / total) * 100).toFixed(2) : "0.00",
      },
    };
  } catch {
    return {
      orders: 0, totalProfit: 0, products: 0, customers: 0,
      inventory: 0, rawMaterials: 0, employees: 0, machines: 0,
      workOrders: [],
      productionStatus: { pending: 0, inProgress: 0, completed: 0, total: 0, pendingPct: "0.00", inProgressPct: "0.00", completedPct: "0.00" },
    };
  }
}

export default async function DashboardPage() {
  const { orgId } = await getAuthContext();
  const stats = await getStats(orgId);
  return <DashboardClient stats={stats} />;
}
