import { requireSaasAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import SaasAdminDashboard from "./SaasAdminDashboard";

export default async function SaasAdminPage() {
  await requireSaasAdmin();

  // DB stats
  const [orgsCount, totalMembers, organizations, planCounts] = await Promise.all([
    prisma.organization.count(),
    prisma.orgUser.count(),
    prisma.organization.findMany({
      include: {
        _count: { select: { users: true, plants: true, workOrders: true } },
        users: { select: { id: true, name: true, email: true, role: true, clerkUserId: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.organization.groupBy({ by: ["plan"], _count: { _all: true } }),
  ]);

  // Clerk stats
  let activeSessions: any[] = [];
  let totalLoggedInToday = 0;
  let failedLogins = 0;
  let clerkUsers: any[] = [];

  try {
    const clerk = await clerkClient();

    // Active sessions
    const sessions = await clerk.sessions.getSessionList({ status: "active", limit: 100 });
    activeSessions = await Promise.all(
      sessions.data.map(async (s) => {
        try {
          const u = await clerk.users.getUser(s.userId);
          const orgId = s.lastActiveOrganizationId;
          const org = orgId ? organizations.find(o => o.id === orgId) : null;
          return {
            userId: s.userId,
            email: u.emailAddresses[0]?.emailAddress ?? "—",
            name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unknown",
            org: org?.name ?? "—",
            lastActive: new Date(s.lastActiveAt).toLocaleString("en-IN"),
          };
        } catch { return null; }
      })
    );
    activeSessions = activeSessions.filter(Boolean);

    // Today's logins
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todaySessions = await clerk.sessions.getSessionList({ limit: 500 });
    totalLoggedInToday = todaySessions.data.filter(s => new Date(s.createdAt) >= today).length;

    // All users (for members page)
    const usersResponse = await clerk.users.getUserList({ limit: 100 });
    clerkUsers = usersResponse.data.map(u => ({
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress ?? "—",
      name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—",
      createdAt: new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      lastSignIn: u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString("en-IN") : "Never",
    }));
  } catch (e) { console.error("Clerk stats error:", e); }

  const serverMeta = {
    nodeVersion: process.version,
    platform: process.platform,
    uptime: Math.floor(process.uptime()),
    memMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  };

  return (
    <SaasAdminDashboard
      stats={{ orgsCount, totalMembers, totalLoggedInToday, activeSessions: activeSessions.length, failedLogins, serverMeta }}
      organizations={organizations}
      planCounts={planCounts}
      activeSessions={activeSessions}
      clerkUsers={clerkUsers}
    />
  );
}
