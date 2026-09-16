const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.orgUser.findMany({
    include: {
      factoryRoles: {
        include: { role: { include: { permissions: { include: { permission: true } } } } }
      }
    }
  });

  for (const u of users) {
    console.log(`User ${u.name} (${u.clerkUserId}): Roles: ${u.factoryRoles.length}`);
    for (const fr of u.factoryRoles) {
      console.log(`  Role: ${fr.role.name} Permissions: ${fr.role.permissions.length}`);
    }
  }
}

check().finally(() => prisma.$disconnect());
