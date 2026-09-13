import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const to   = searchParams.get("to")   ? new Date(searchParams.get("to")!)   : new Date();

    const logs = await prisma.machineStatusLog.findMany({
      where: { machineId: (await params).id, changedAt: { gte: from, lte: to } },
      orderBy: { changedAt: "asc" },
    });

    if (logs.length < 2) return NextResponse.json({ availability: null, activeMinutes: 0, idleMinutes: 0, stoppedMinutes: 0, message: "Not enough data" });

    let activeMs = 0, idleMs = 0, stoppedMs = 0;
    for (let i = 0; i < logs.length - 1; i++) {
      const duration = new Date(logs[i + 1].changedAt).getTime() - new Date(logs[i].changedAt).getTime();
      if (logs[i].status === "ACTIVE")  activeMs  += duration;
      else if (logs[i].status === "IDLE")    idleMs    += duration;
      else if (logs[i].status === "STOPPED") stoppedMs += duration;
    }
    const totalMs = activeMs + idleMs + stoppedMs;
    const availability = totalMs > 0 ? Math.round((activeMs / (activeMs + stoppedMs)) * 10000) / 100 : 0;

    return NextResponse.json({
      availability,
      activeMinutes:  Math.round(activeMs  / 60000),
      idleMinutes:    Math.round(idleMs    / 60000),
      stoppedMinutes: Math.round(stoppedMs / 60000),
      totalLogs: logs.length,
      from: from.toISOString(),
      to: to.toISOString(),
    });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

