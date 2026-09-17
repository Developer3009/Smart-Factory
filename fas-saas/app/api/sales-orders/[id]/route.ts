import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { salesOrderSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";
import { sendSalesOrderEmail } from "@/lib/email";
import { OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;
    const order = await prisma.salesOrder.findFirst({ 
      where: { id, customer: { organizationId: orgId } },
      include: { customer: true }
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

// Allowed state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "DECLINED", "CANCELLED"],
  CONFIRMED: ["IN_PRODUCTION", "CANCELLED"],
  IN_PRODUCTION: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [], // Terminal
  DECLINED: [],  // Terminal
  CANCELLED: []  // Terminal
};

export const PATCH = withPermission("orders", "edit", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.salesOrder.findFirst({ 
    where: { id, customer: { organizationId: orgId } },
    include: { customer: true }
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data = salesOrderSchema.partial().parse(body);

  // State Machine Guard
  if (data.status && data.status !== existing.status) {
    const allowed = VALID_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(data.status)) {
      return NextResponse.json({ 
        error: `Invalid state transition from ${existing.status} to ${data.status}.` 
      }, { status: 400 });
    }
  }

  const order = await prisma.salesOrder.update({
    where: { id },
    data,
    include: { customer: true }
  });

  if (data.status && data.status !== existing.status) {
    if (data.status === 'CONFIRMED' || data.status === 'DECLINED') {
      await sendSalesOrderEmail(order, order.customer, data.status as "CONFIRMED" | "DECLINED");
    }
  }

  return NextResponse.json(order);
});

export const DELETE = withPermission("orders", "delete", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.salesOrder.findFirst({ where: { id, customer: { organizationId: orgId } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.salesOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
