import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { withPermission } from "@/lib/api-middleware";
import { machineSchema, paginationSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getAuthContext();
    const { searchParams } = new URL(req.url);
    const { take, skip } = paginationSchema.parse({
      take: searchParams.get("take") || undefined,
      skip: searchParams.get("skip") || undefined,
    });

    const machines = await prisma.machine.findMany({
      where: { plant: { organizationId: orgId } },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return NextResponse.json(machines);
  } catch (err: any) {
    if (err.message && err.message.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(err);
  }
}

export const POST = withPermission("machines", "create", async (req: NextRequest, context: any, orgId: string) => {
  const body = await req.json();
  const data = machineSchema.parse(body);

  // verify plant belongs to org
  const plant = await prisma.plant.findUnique({ where: { id: data.plantId, organizationId: orgId } });
  if (!plant) return NextResponse.json({ error: "Invalid plant" }, { status: 400 });

  const machine = await prisma.machine.create({
    data: {
      plantId: data.plantId,
      name: data.name,
      description: data.description,
      machineType: data.machineType,
      protocol: data.protocol,
      ipAddress: data.ipAddress,
    },
  });
  return NextResponse.json(machine, { status: 201 });
});
