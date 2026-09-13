import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: { product: true, plant: { include: { machines: true } }, routingSteps: { orderBy: { stepNumber: "asc" } }, productionLogs: { include: { machine: true, operator: true } } },
    });
    if (!wo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(wo);
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const wo = await prisma.workOrder.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.quantity && { quantity: body.quantity }),
        ...(body.dueDate && { dueDate: new Date(body.dueDate) }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });
    return NextResponse.json(wo);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.routingStep.deleteMany({ where: { workOrderId: id } });
    await prisma.workOrder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
