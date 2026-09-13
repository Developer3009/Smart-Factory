import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.pin || !body.organizationId) {
      return NextResponse.json({ error: "pin and organizationId required" }, { status: 400 });
    }

    const workers = await prisma.orgUser.findMany({
      where: { organizationId: body.organizationId, loginType: "PIN", isActive: true, deletedAt: null, pin: { not: null } },
    });

    let matchedWorker = null;
    for (const w of workers) {
      if (w.pin && await bcrypt.compare(body.pin, w.pin)) {
        matchedWorker = w;
        break;
      }
    }

    if (!matchedWorker) return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });

    const token = Buffer.from(JSON.stringify({ userId: matchedWorker.id, orgId: matchedWorker.organizationId, ts: Date.now() })).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set("worker_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1800,
      path: "/",
    });

    return NextResponse.json({ success: true, user: { id: matchedWorker.id, name: matchedWorker.name, email: matchedWorker.email } });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
