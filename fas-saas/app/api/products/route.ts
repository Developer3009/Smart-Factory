import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/tenant";

export async function GET() {
  try {
    const orgId = await getCurrentOrgId();
    const products = await prisma.product.findMany({
      where: { organizationId: orgId },
      include: { bomItems: { include: { item: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const orgId = await getCurrentOrgId();
    const body = await req.json();

    const product = await prisma.product.create({
      data: {
        organizationId: orgId,
        name: body.name,
        sku: body.sku,
        unitPrice: body.unitPrice ?? 0,
        description: body.description,
        bomItems: body.bomItems?.length
          ? {
              create: body.bomItems.map((b: any) => ({
                itemId: b.itemId,
                quantity: b.quantity,
                unit: b.unit ?? "pcs",
              })),
            }
          : undefined,
      },
      include: { bomItems: { include: { item: true } } },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
