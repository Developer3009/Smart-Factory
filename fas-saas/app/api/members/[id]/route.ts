import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { clerkClient } from "@clerk/nextjs/server";

// DELETE /api/members/[id] — remove a member
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext();

    if (ctx.role !== ROLES.ORG_ADMIN && ctx.role !== ROLES.SAAS_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Verify the member belongs to the caller's org (unless saas admin)
    const member = await prisma.orgUser.findUnique({ where: { id } });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!ctx.isSaasAdmin && member.organizationId !== ctx.orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.orgUser.delete({ where: { id } });
    const organization = await prisma.organization.findUnique({
      where: { id: member.organizationId },
      select: { clerkOrgId: true },
    });
    if (organization?.clerkOrgId) {
      await (await clerkClient()).organizations.deleteOrganizationMembership({
        organizationId: organization.clerkOrgId,
        userId: member.clerkUserId,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/members/[id] — update member role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext();

    if (ctx.role !== ROLES.ORG_ADMIN && ctx.role !== ROLES.SAAS_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { role } = await req.json();

    const member = await prisma.orgUser.findUnique({ where: { id } });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!ctx.isSaasAdmin && member.organizationId !== ctx.orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedRoles = ctx.isSaasAdmin
      ? ["ADMIN", "PLANT_MANAGER", "SUPERVISOR", "OPERATOR"]
      : ["PLANT_MANAGER", "SUPERVISOR", "OPERATOR"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid member role" }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: member.organizationId },
      select: { clerkOrgId: true },
    });
    if (!organization?.clerkOrgId) {
      return NextResponse.json({ error: "Organization is not connected to Clerk" }, { status: 409 });
    }

    await (await clerkClient()).organizations.updateOrganizationMembership({
      organizationId: organization.clerkOrgId,
      userId: member.clerkUserId,
      role: role === "ADMIN" ? "org:admin" : "org:member",
    });

    const updated = await prisma.orgUser.update({
      where: { id },
      data: { role },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
