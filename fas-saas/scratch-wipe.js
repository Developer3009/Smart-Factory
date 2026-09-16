const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function wipe() {
  await prisma.userFactoryRole.deleteMany({});
  await prisma.orgUser.deleteMany({ where: { clerkUserId: { startsWith: 'user_' } } });
  await prisma.customer.deleteMany({});
}
wipe().finally(() => prisma.$disconnect());
