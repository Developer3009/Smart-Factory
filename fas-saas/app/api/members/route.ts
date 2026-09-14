import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

// GET /api/members — list members of the current org
export async function GET() {
  try {
    const { orgId } = await getAuthContext();
    const members = await prisma.orgUser.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(members);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

// POST /api/members — add a member to org (OrgAdmin or SaasAdmin only)
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();

    // Only ORG_ADMIN or SAAS_ADMIN can add members
    if (ctx.role !== ROLES.ADMIN && ctx.role !== ROLES.SAAS_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, clerkUserId, role, organizationId } = body;

    if (!name || !clerkUserId) {
      return NextResponse.json({ error: "name and clerkUserId are required" }, { status: 400 });
    }

    const targetOrgId = ctx.isSaasAdmin && organizationId ? organizationId : ctx.orgId;
    if (!targetOrgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // Validate role: ORG_ADMIN can only add OPERATOR, SUPERVISOR, PLANT_MANAGER
    // SAAS_ADMIN can also add ADMIN role
    const allowedRoles = ctx.isSaasAdmin
      ? ["ADMIN", "PLANT_MANAGER", "SUPERVISOR", "OPERATOR"]
      : ["PLANT_MANAGER", "SUPERVISOR", "OPERATOR"];

    const memberRole = role && allowedRoles.includes(role) ? role : "OPERATOR";

    // Check for duplicate
    const existing = await prisma.orgUser.findFirst({
      where: { organizationId: targetOrgId, clerkUserId },
    });
    if (existing) {
      return NextResponse.json({ error: "User already exists in this organization" }, { status: 409 });
    }

    const member = await prisma.orgUser.create({
      data: {
        organizationId: targetOrgId,
        clerkUserId,
        name,
        email: email || null,
        role: memberRole,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
