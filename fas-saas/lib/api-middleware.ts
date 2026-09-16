import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { ROLES, Role } from "@/lib/roles";
import { handleApiError } from "@/lib/api-errors";

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
      if (err.message && err.message.includes("NEXT_REDIRECT")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return handleApiError(err);
    }
  };
}

export function withOrgAdmin(handler: Handler) {
  return withRole([ROLES.ADMIN, ROLES.SAAS_ADMIN], handler);
}

export function withPermission(module: string, action: string, handler: Handler) {
  return async (req: NextRequest, context: RouteContext) => {
    try {
      const ctx = await getAuthContext();
      if (!ctx.isSaasAdmin) {
        const permKey = `${module}:${action}`;
        if (!ctx.permissions.includes(permKey) && !ctx.permissions.includes("*:*")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
      return await handler(req, context, ctx.orgId);
    } catch (err: any) {
      if (err.message && err.message.includes("NEXT_REDIRECT")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return handleApiError(err);
    }
  };
}
