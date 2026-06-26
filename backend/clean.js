const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: { endsWith: '@example.com' },
      role: 'VENDOR'
    }
  });

  console.log(`Found ${users.length} seeded vendor users to delete.`);

  const vendorProfiles = await prisma.vendorProfile.findMany({
    where: { user: { email: { endsWith: '@example.com' } } }
  });

  const ids = vendorProfiles.map(v => v.id);

  console.log(`Found ${ids.length} seeded vendor profiles.`);
  
  if (ids.length > 0) {
    const result = await prisma.vendorProfile.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() }
    });
    console.log(`Soft deleted ${result.count} vendor profiles.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
