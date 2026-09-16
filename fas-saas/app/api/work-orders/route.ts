import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { workOrderSchema, paginationSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getAuthContext();
    const { searchParams } = new URL(req.url);
    const { take, skip } = paginationSchema.parse({
      take: searchParams.get("take") || undefined,
      skip: searchParams.get("skip") || undefined,
    });

    const orders = await prisma.workOrder.findMany({
      where: { plant: { organizationId: orgId } },
      include: { product: true, plant: true, shift: true, assignedToUser: true },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return NextResponse.json(orders);
  } catch (err: any) {
    if (err.message && err.message.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(err);
  }
}

export const POST = withPermission("orders", "create", async (req: NextRequest, context: any, orgId: string) => {
  const body = await req.json();
  const data = workOrderSchema.parse(body);

  const plant = await prisma.plant.findUnique({ where: { id: data.plantId, organizationId: orgId } });
  if (!plant) return NextResponse.json({ error: "Invalid plant" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: data.productId, organizationId: orgId } });
  if (!product) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  const order = await prisma.workOrder.create({
    data: {
      orderNumber: `WO-${Date.now()}`,
      plantId: data.plantId,
      productId: data.productId,
      shiftId: data.shiftId,
      quantity: data.quantity,
      targetQty: data.targetQty,
      dueDate: new Date(data.dueDate),
      estimatedHrs: data.estimatedHrs,
      notes: data.notes,
      status: "PLANNED",
    },
  });
  return NextResponse.json(order, { status: 201 });
});
