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
        users: { select: { id: true, name: true, email: true, role: true, clerkUserId: true, createdAt: true, isActive: true, lastActiveAt: true }, orderBy: { createdAt: "asc" } },
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

    // Clerk's latest SDK requires userId or clientId for getSessionList.
    // We will skip global active session stats and just show total users.
    activeSessions = [];
    totalLoggedInToday = 0;

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

