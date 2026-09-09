import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

export async function GET() {
  try {
    const { orgId } = await getAuthContext();
    const items = await prisma.inventoryItem.findMany({ where: { organizationId: orgId, type: "RAW_MATERIAL" }, orderBy: { name: "asc" } });
    return NextResponse.json(items);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (ctx.role !== ROLES.ORG_ADMIN && ctx.role !== ROLES.SAAS_ADMIN) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { name, sku, quantityOnHand, reorderPoint, unit, unitCost } = await req.json();
    if (!name?.trim() || !sku?.trim()) return NextResponse.json({ error: "Name and SKU are required" }, { status: 400 });
    const item = await prisma.inventoryItem.create({
      data: {
        organizationId: ctx.orgId, name: name.trim(), sku: sku.trim(),
        type: "RAW_MATERIAL",
        quantityOnHand: quantityOnHand ?? 0, reorderPoint: reorderPoint ?? 0,
        unit: unit ?? "pcs", unitCost: unitCost ?? 0,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
