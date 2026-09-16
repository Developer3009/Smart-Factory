import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { vendorSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;
    const vendor = await prisma.vendor.findUnique({ 
      where: { id, organizationId: orgId }
    });
    if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(vendor);
  } catch (err: any) {
    if (err.message && err.message.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(err);
  }
}

export const PATCH = withPermission("vendors", "edit", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.vendor.findUnique({ where: { id, organizationId: orgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data = vendorSchema.partial().parse(body);

  const vendor = await prisma.vendor.update({
    where: { id },
    data,
  });
  return NextResponse.json(vendor);
});

export const DELETE = withPermission("vendors", "delete", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.vendor.findUnique({ where: { id, organizationId: orgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.vendor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
