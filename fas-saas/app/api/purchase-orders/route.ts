import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/tenant";

// GET all purchase orders
export async function GET() {
  try {
    const orgId = await getCurrentOrgId();
    const orders = await prisma.purchaseOrder.findMany({
      where: { organizationId: orgId },
      include: { vendor: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

// POST create purchase order
export async function POST(req: Request) {
  try {
    const orgId = await getCurrentOrgId();
    const body = await req.json();
    if (!body.vendorId || !body.amount) return NextResponse.json({ error: "Vendor and amount required." }, { status: 400 });

    const order = await prisma.purchaseOrder.create({
      data: {
        organizationId: orgId,
        vendorId: body.vendorId,
        amount: parseFloat(body.amount),
        status: body.status ?? "PENDING",
        notes: body.notes ?? null,
        expectedDelivery: body.expectedDelivery ? new Date(body.expectedDelivery) : null,
      },
      include: { vendor: true },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
