import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { handleApiError } from "@/lib/api-errors";
import { sendPurchaseOrderEmail } from "@/lib/email";
import { z } from "zod";

const purchaseOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
  expectedDelivery: z.string().datetime().optional().nullable()
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;
    const order = await prisma.purchaseOrder.findFirst({ 
      where: { id, vendor: { organizationId: orgId } },
      include: { vendor: true }
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

export const PATCH = withPermission("purchase_orders", "edit", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.purchaseOrder.findFirst({ 
    where: { id, vendor: { organizationId: orgId } },
    include: { vendor: true }
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data = purchaseOrderSchema.partial().parse(body);

  const order = await prisma.purchaseOrder.update({
    where: { id },
    data,
    include: { vendor: true }
  });

  if (body.status && body.status !== existing.status) {
    if (body.status === 'APPROVED' || body.status === 'DECLINED' || body.status === 'CANCELLED') {
      await sendPurchaseOrderEmail(order, order.vendor, body.status);
    }
  }

  return NextResponse.json(order);
});

export const DELETE = withPermission("purchase_orders", "delete", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.purchaseOrder.findFirst({ where: { id, vendor: { organizationId: orgId } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.purchaseOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
