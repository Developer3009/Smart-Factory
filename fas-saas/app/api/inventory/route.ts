import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { inventorySchema, paginationSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getAuthContext();
    const { searchParams } = new URL(req.url);
    const { take, skip } = paginationSchema.parse({
      take: searchParams.get("take") || undefined,
      skip: searchParams.get("skip") || undefined,
    });

    const inventory = await prisma.inventoryItem.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return NextResponse.json(inventory);
  } catch (err: any) {
    if (err.message && err.message.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(err);
  }
}

export const POST = withPermission("inventory", "create", async (req: NextRequest, context: any, orgId: string) => {
  const body = await req.json();
  const data = inventorySchema.parse(body);

  if (data.plantId) {
    const plant = await prisma.plant.findUnique({ where: { id: data.plantId, organizationId: orgId } });
    if (!plant) return NextResponse.json({ error: "Invalid plant" }, { status: 400 });
  }

  const inventoryItem = await prisma.inventoryItem.create({
    data: {
      organizationId: orgId,
      plantId: data.plantId,
      sku: data.sku,
      name: data.name,
      type: data.type,
      quantityOnHand: data.quantityOnHand,
      reorderPoint: data.reorderPoint,
      unit: data.unit,
      unitCost: data.unitCost,
    },
  });
  return NextResponse.json(inventoryItem, { status: 201 });
});
