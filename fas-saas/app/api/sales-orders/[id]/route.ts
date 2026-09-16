import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { salesOrderSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;
    const order = await prisma.salesOrder.findUnique({ 
      where: { id, organizationId: orgId },
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

export const PATCH = withPermission("orders", "edit", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.salesOrder.findUnique({ where: { id, organizationId: orgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data = salesOrderSchema.partial().parse(body);

  const order = await prisma.salesOrder.update({
    where: { id },
    data,
  });
  return NextResponse.json(order);
});

export const DELETE = withPermission("orders", "delete", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.salesOrder.findUnique({ where: { id, organizationId: orgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.salesOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
