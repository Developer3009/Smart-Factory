import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

async function getStats() {
  try {
    const [orders, products, customers, machines, inventory, rawMaterials, employees, workOrders] =
      await Promise.all([
        prisma.workOrder.count(),
        prisma.product.count(),
        prisma.customer.count(),
        prisma.machine.count(),
        prisma.inventoryItem.count({ where: { type: "FINISHED_GOOD" } }),
        prisma.inventoryItem.count({ where: { type: "RAW_MATERIAL" } }),
        prisma.orgUser.count(),
        prisma.workOrder.findMany({
          where: {
            status: { in: ["QUEUED", "IN_PROGRESS"] },
          },
          include: { product: true, plant: { include: { machines: { take: 1 } } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);

    // Calculate profit from sales orders (stub for now)
    const salesOrders = await prisma.salesOrder.findMany();
    const totalProfit = salesOrders.reduce((sum, o) => sum + o.amount, 0);

    // Production summary for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = await prisma.productionLog.findMany({
      where: { startTime: { gte: today } },
    });
    const pending = await prisma.workOrder.count({ where: { status: "QUEUED" } });
    const inProgress = await prisma.workOrder.count({ where: { status: "IN_PROGRESS" } });
    const completed = await prisma.workOrder.count({ where: { status: "COMPLETED" } });
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
  const stats = await getStats();
  return <DashboardClient stats={stats} />;
}
