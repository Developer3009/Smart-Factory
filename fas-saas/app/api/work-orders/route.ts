import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/tenant";

export async function GET() {
  try {
    const orgId = await getCurrentOrgId();
    const wos = await prisma.workOrder.findMany({
      where: { organizationId: orgId },
      include: {
        product: true,
        plant: { include: { machines: { take: 1 } } },
        routingSteps: { orderBy: { stepNumber: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(wos);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const orgId = await getCurrentOrgId();
    const body = await req.json();

    const wo = await prisma.workOrder.create({
      data: {
        organizationId: orgId,
        plantId: body.plantId,
        productId: body.productId,
        quantity: body.quantity,
        dueDate: new Date(body.dueDate),
        estimatedHrs: body.estimatedHrs ?? null,
        notes: body.notes,
        status: "QUEUED",
        routingSteps: body.routingSteps?.length
          ? {
              create: body.routingSteps.map((s: any) => ({
                stepNumber: s.stepNumber,
                description: s.description,
                machineType: s.machineType ?? null,
                estimatedHrs: s.estimatedHrs ?? null,
                status: "PENDING",
              })),
            }
          : undefined,
      },
      include: {
        product: true,
        routingSteps: true,
        plant: { include: { machines: { take: 1 } } },
      },
    });
    return NextResponse.json(wo, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
