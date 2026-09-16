const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addPerms() {
  console.log("Adding permissions...");
  
  // Create modules/actions
  const perms = [
    { module: '*', action: '*' }, // wildcard for Admin
    { module: 'products', action: 'create' },
    { module: 'products', action: 'read' },
    { module: 'orders', action: 'create' },
    { module: 'orders', action: 'read' },
    { module: 'vendors', action: 'create' },
    { module: 'vendors', action: 'read' },
  ];

  const permMap = {};
  for (const p of perms) {
    let perm = await prisma.permission.findFirst({ where: { module: p.module, action: p.action } });
    if (!perm) {
      perm = await prisma.permission.create({ data: { module: p.module, action: p.action } });
    }
    permMap[`${p.module}:${p.action}`] = perm.id;
  }

  const roles = await prisma.role.findMany();
  for (const role of roles) {
    if (role.name === 'ADMIN') {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permMap['*:*'] } },
        update: {},
        create: { roleId: role.id, permissionId: permMap['*:*'] }
      });
    } else if (role.name === 'PLANT_MANAGER') {
      // give everything explicitly
      for (const p of perms) {
        if (p.module === '*') continue;
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permMap[`${p.module}:${p.action}`] } },
          update: {},
          create: { roleId: role.id, permissionId: permMap[`${p.module}:${p.action}`] }
        });
      }
    } else if (role.name === 'OPERATOR') {
       // operator can't create products or orders
       await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permMap['products:read'] } },
          update: {},
          create: { roleId: role.id, permissionId: permMap['products:read'] }
        });
    } else if (role.name === 'VIEWER') {
       await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permMap['products:read'] } },
          update: {},
          create: { roleId: role.id, permissionId: permMap['products:read'] }
        });
    }
  }
  console.log("Permissions added.");
}

addPerms().catch(console.error).finally(() => prisma.$disconnect());
