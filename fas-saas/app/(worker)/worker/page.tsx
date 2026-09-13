import { prisma } from "@/lib/prisma";
import WorkerLoginClient from "./WorkerLoginClient";

export default async function WorkerLoginPage() {
  const orgs = await prisma.organization.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  }).catch(() => []);
  return <WorkerLoginClient organizations={orgs} />;
}
