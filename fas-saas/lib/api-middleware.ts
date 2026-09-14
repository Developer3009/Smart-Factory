import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { ROLES, Role } from "@/lib/roles";

type RouteContext = { params: Promise<any> | any };
type Handler = (req: NextRequest, context: RouteContext, orgId: string) => Promise<NextResponse | Response> | NextResponse | Response;

export function withRole(allowedRoles: Role[], handler: Handler) {
  return async (req: NextRequest, context: RouteContext) => {
    try {
      const ctx = await getAuthContext();
      if (!allowedRoles.includes(ctx.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return await handler(req, context, ctx.orgId);
    } catch (err: any) {
      console.error("[API Middleware Error]:", err);
      if (err.message && err.message.includes("NEXT_REDIRECT")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
  };
}

export function withOrgAdmin(handler: Handler) {
  return withRole([ROLES.ADMIN, ROLES.SAAS_ADMIN], handler);
}
