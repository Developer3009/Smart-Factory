import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/tenant";
import { salesOrderSchema } from "@/lib/validations";

export async function GET() {
  try {
    const orgId = await getCurrentOrgId();
    // SalesOrder doesn't have organizationId directly, filter via customer
    const orders = await prisma.salesOrder.findMany({
      where: { customer: { organizationId: orgId } },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const orgId = await getCurrentOrgId();
    const body = salesOrderSchema.parse(await req.json());

    const customer = await prisma.customer.findUnique({ where: { id: body.customerId } });
    if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    if (!customer.email || !customer.phone) {
      return NextResponse.json({ error: "Customer email and phone required before creating an order" }, { status: 400 });
    }

    const order = await prisma.salesOrder.create({
      data: {
        customerId: body.customerId,
        amount: body.amount,
        status: "PENDING",
      },
      include: { customer: true },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
