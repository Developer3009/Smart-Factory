import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/tenant";

export async function GET() {
  try {
    const orgId = await getCurrentOrgId();

    const [orders, products, customers, machines, inventory, rawMaterials, employees] =
      await Promise.all([
        prisma.workOrder.count({ where: { organizationId: orgId } }),
        prisma.product.count({ where: { organizationId: orgId } }),
        prisma.customer.count({ where: { organizationId: orgId } }),
        prisma.machine.count({ where: { organizationId: orgId } }),
        prisma.inventoryItem.count({ where: { organizationId: orgId, type: "FINISHED_GOOD" } }),
        prisma.inventoryItem.count({ where: { organizationId: orgId, type: "RAW_MATERIAL" } }),
        prisma.orgUser.count({ where: { organizationId: orgId } }),
      ]);

    // SalesOrder links through Customer → use a join via customer organizationId
    const salesOrders = await prisma.salesOrder.findMany({
      where: { customer: { organizationId: orgId } },
    });
    const totalProfit = salesOrders.reduce((sum, o) => sum + o.amount, 0);

    const pending = await prisma.workOrder.count({ where: { organizationId: orgId, status: "QUEUED" } });
    const inProgress = await prisma.workOrder.count({ where: { organizationId: orgId, status: "IN_PROGRESS" } });
    const completed = await prisma.workOrder.count({ where: { organizationId: orgId, status: "COMPLETED" } });
    const total = pending + inProgress + completed;

    return NextResponse.json({
      orders, totalProfit, products, customers,
      inventory, rawMaterials, employees, machines,
      productionStatus: {
        pending, inProgress, completed, total,
        pendingPct: total ? ((pending / total) * 100).toFixed(2) : "0.00",
        inProgressPct: total ? ((inProgress / total) * 100).toFixed(2) : "0.00",
        completedPct: total ? ((completed / total) * 100).toFixed(2) : "0.00",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
