import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { workOrderSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;
    const order = await prisma.workOrder.findFirst({ 
      where: { id, plant: { organizationId: orgId } },
      include: { product: true, plant: true, shift: true, assignedToUser: true }
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err: any) {
    if (err.message && err.message.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(err);
  }
}

export const PATCH = withPermission("orders", "edit", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.workOrder.findFirst({ where: { id, plant: { organizationId: orgId } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data = workOrderSchema.partial().parse(body);

  if (data.plantId) {
    const plant = await prisma.plant.findUnique({ where: { id: data.plantId, organizationId: orgId } });
    if (!plant) return NextResponse.json({ error: "Invalid plant" }, { status: 400 });
  }
  if (data.productId) {
    const product = await prisma.product.findUnique({ where: { id: data.productId, organizationId: orgId } });
    if (!product) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const updateData: any = { ...data };
  if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

  const order = await prisma.workOrder.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json(order);
});

export const DELETE = withPermission("orders", "delete", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.workOrder.findFirst({ where: { id, plant: { organizationId: orgId } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.workOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
