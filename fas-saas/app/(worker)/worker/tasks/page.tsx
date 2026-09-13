import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WorkerTaskClient from "./WorkerTaskClient";

export default async function WorkerTasksPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("worker_session");
  if (!sessionCookie) redirect("/worker");

  let session: { userId: string; orgId: string } | null = null;
  try {
    session = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());
  } catch {
    redirect("/worker");
  }
  if (!session) redirect("/worker");

  const user = await prisma.orgUser.findUnique({ where: { id: session.userId } }).catch(() => null);
  if (!user) redirect("/worker");

  const workOrders = await prisma.workOrder.findMany({
    where: { organizationId: session.orgId, status: { in: ["QUEUED", "IN_PROGRESS"] } },
    include: { product: true, plant: true },
    orderBy: { dueDate: "asc" },
    take: 20,
  }).catch(() => []);

  return <WorkerTaskClient user={user} workOrders={workOrders} />;
}
