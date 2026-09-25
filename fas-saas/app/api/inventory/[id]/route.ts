import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/tenant";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orgId = await getCurrentOrgId();
    const body = await req.json();
    const { id } = await params;
    const existing = await prisma.inventoryItem.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(body.quantityOnHand !== undefined && { quantityOnHand: parseFloat(body.quantityOnHand) }),
        ...(body.reorderPoint !== undefined && { reorderPoint: parseFloat(body.reorderPoint) }),
        ...(body.unitCost !== undefined && { unitCost: parseFloat(body.unitCost) }),
        ...(body.name !== undefined && { name: body.name }),
      },
    });
    return NextResponse.json(updated);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orgId = await getCurrentOrgId();
    const { id } = await params;
    const existing = await prisma.inventoryItem.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
