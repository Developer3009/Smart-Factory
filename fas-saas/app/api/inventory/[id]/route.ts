import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { inventorySchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;
    const item = await prisma.inventoryItem.findUnique({ 
      where: { id, organizationId: orgId }
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (err: any) {
    if (err.message && err.message.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(err);
  }
}

export const PATCH = withPermission("inventory", "edit", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.inventoryItem.findUnique({ where: { id, organizationId: orgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data = inventorySchema.partial().parse(body);

  if (data.plantId) {
    const plant = await prisma.plant.findUnique({ where: { id: data.plantId, organizationId: orgId } });
    if (!plant) return NextResponse.json({ error: "Invalid plant" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.update({
    where: { id },
    data,
  });
  return NextResponse.json(item);
});

export const DELETE = withPermission("inventory", "delete", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.inventoryItem.findUnique({ where: { id, organizationId: orgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.inventoryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
