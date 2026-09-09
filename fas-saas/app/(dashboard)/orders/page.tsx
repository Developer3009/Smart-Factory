import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import WorkOrdersClient from "./WorkOrdersClient";

export default async function OrdersPage() {
  const { orgId } = await getAuthContext();
  let workOrders: any[] = [];
  let products: any[] = [];
  let plants: any[] = [];

  try {
    [workOrders, products, plants] = await Promise.all([
      prisma.workOrder.findMany({
        where: { organizationId: orgId },
        include: {
          product: true,
          plant: { include: { machines: { take: 1 } } },
          routingSteps: { orderBy: { stepNumber: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
      prisma.plant.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    ]);
  } catch (e) { console.error(e); }

  return <WorkOrdersClient workOrders={workOrders} products={products} plants={plants} />;
}
