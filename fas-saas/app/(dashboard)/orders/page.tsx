import { prisma } from "@/lib/prisma";
import WorkOrdersClient from "./WorkOrdersClient";

export default async function OrdersPage() {
  let workOrders: any[] = [];
  let products: any[] = [];
  let plants: any[] = [];

  try {
    [workOrders, products, plants] = await Promise.all([
      prisma.workOrder.findMany({
        include: {
          product: true,
          plant: { include: { machines: { take: 1 } } },
          routingSteps: { orderBy: { stepNumber: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({ orderBy: { name: "asc" } }),
      prisma.plant.findMany({ orderBy: { name: "asc" } }),
    ]);
  } catch (e) { console.error(e); }

  return <WorkOrdersClient workOrders={workOrders} products={products} plants={plants} />;
}
