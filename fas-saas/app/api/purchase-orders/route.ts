import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/tenant";
import { purchaseOrderSchema } from "@/lib/validations";

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

export async function POST(req: Request) {
  try {
    const orgId = await getCurrentOrgId();
    const body = purchaseOrderSchema.parse(await req.json());

    const vendor = await prisma.vendor.findUnique({ where: { id: body.vendorId } });
    if (!vendor) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    if (!vendor.email || !vendor.phone) {
      return NextResponse.json({ error: "Vendor email and phone required before creating an order" }, { status: 400 });
    }

    const order = await prisma.purchaseOrder.create({
      data: {
        organizationId: orgId,
        vendorId: body.vendorId,
        amount: body.amount,
        status: "PENDING",
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
