import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { productSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;
    const product = await prisma.product.findUnique({ 
      where: { id, organizationId: orgId }, 
      include: { bomItems: { include: { item: true } } } 
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (err: any) {
    if (err.message && err.message.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(err);
  }
}

export const PATCH = withPermission("products", "edit", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id, organizationId: orgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data = productSchema.partial().parse(body);

  const product = await prisma.product.update({
    where: { id },
    data,
  });
  return NextResponse.json(product);
});

export const DELETE = withPermission("products", "delete", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id, organizationId: orgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.bomItem.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
