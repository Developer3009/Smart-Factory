import { prisma } from "@/lib/prisma";
import ProductionClient from "./ProductionClient";

export default async function ProductionPage() {
  let workOrders: any[] = [];
  try {
    workOrders = await prisma.workOrder.findMany({
      include: {
        product: true,
        plant: { include: { machines: { take: 1 } } },
        routingSteps: { orderBy: { stepNumber: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {}
  return <ProductionClient workOrders={workOrders} />;
}
