import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { handleApiError } from "@/lib/api-errors";

export async function POST(req: NextRequest) {
  try {
    const { orgId } = await getAuthContext();   // orgId from session, NOT request body
    const body = await req.json();
    const { workOrderId, machineId, quantityProduced, operatorId } = body;

    if (!workOrderId || !machineId || quantityProduced === undefined || !operatorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── Ownership checks ─────────────────────────────────────────────────────
    const wo = await prisma.workOrder.findFirst({ where: { id: workOrderId, organizationId: orgId } });
    if (!wo) return NextResponse.json({ error: "Invalid workOrder ID" }, { status: 400 });

    const machine = await prisma.machine.findFirst({ where: { id: machineId, organizationId: orgId } });
    if (!machine) return NextResponse.json({ error: "Invalid machine ID" }, { status: 400 });

    const operator = await prisma.orgUser.findFirst({ where: { id: operatorId, organizationId: orgId } });
    if (!operator) return NextResponse.json({ error: "Invalid operator ID" }, { status: 400 });
    // ────────────────────────────────────────────────────────────────────────

    const log = await prisma.productionLog.create({
      data: {
        organizationId: orgId,
        workOrderId,
        machineId,
        operatorId,
        quantityProduced: parseInt(quantityProduced, 10),
        status: "COMPLETED",
        endTime: new Date(),
      },
    });

    return NextResponse.json(log);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
