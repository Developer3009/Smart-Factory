import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { machineSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;
    const machine = await prisma.machine.findFirst({ 
      where: { id, plant: { organizationId: orgId } }
    });
    if (!machine) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(machine);
  } catch (err: any) {
    if (err.message && err.message.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(err);
  }
}

export const PATCH = withPermission("machines", "edit", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.machine.findFirst({ where: { id, plant: { organizationId: orgId } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data = machineSchema.partial().parse(body);

  const machine = await prisma.machine.update({
    where: { id },
    data,
  });
  return NextResponse.json(machine);
});

export const DELETE = withPermission("machines", "delete", async (req: NextRequest, { params }: any, orgId: string) => {
  const { id } = await params;
  const existing = await prisma.machine.findFirst({ where: { id, plant: { organizationId: orgId } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.machine.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
