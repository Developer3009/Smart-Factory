import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/tenant";

export async function GET() {
  try {
    const orgId = await getCurrentOrgId();
    const items = await prisma.inventoryItem.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(items);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const orgId = await getCurrentOrgId();
    const body = await req.json();

    const plant = await prisma.plant.findFirst({ where: { organizationId: orgId } });

    const item = await prisma.inventoryItem.create({
      data: {
        organizationId: orgId,
        plantId: plant?.id ?? null,
        sku: body.sku,
        name: body.name,
        type: body.type ?? "RAW_MATERIAL",
        quantityOnHand: parseFloat(body.quantityOnHand) || 0,
        reorderPoint: parseFloat(body.reorderPoint) || 0,
        unit: body.unit ?? "pcs",
        unitCost: parseFloat(body.unitCost) || 0,
      },
    });

    if (item.quantityOnHand > 0) {
      await prisma.inventoryMovement.create({
        data: {
          itemId: item.id,
          quantity: item.quantityOnHand,
          type: "RECEIPT",
          reference: "Initial stock",
          notes: "Added via UI",
        },
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
