import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/tenant";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const logs = await prisma.machineStatusLog.findMany({
      where: { machineId: (await params).id },
      orderBy: { changedAt: "desc" },
      take: 200,
    });
    return NextResponse.json(logs);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const log = await prisma.machineStatusLog.create({
      data: { machineId: (await params).id, status: body.status, source: body.source ?? "MANUAL", notes: body.notes ?? null },
    });
    await prisma.machine.update({ where: { id: (await params).id }, data: { status: body.status, lastHeartbeatAt: new Date() } });
    return NextResponse.json(log, { status: 201 });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

