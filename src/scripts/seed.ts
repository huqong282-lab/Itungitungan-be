import { prisma } from "../infrastructure/prisma/client.js";
import { initializeDefaultCatalog } from "../infrastructure/seed/default-catalog.js";

try {
  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    await prisma.$transaction((tx) => initializeDefaultCatalog(tx, user.id));
  }

  console.log(`Default catalog initialized for ${users.length} user(s).`);
} finally {
  await prisma.$disconnect();
}
