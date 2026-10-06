import type { PrismaClient } from "../../generated/prisma/client.js";
import { initializeDefaultCatalog } from "../../infrastructure/seed/default-catalog.js";
import type { RegisterInput } from "./auth.types.js";

export function createAuthRepository(prisma: PrismaClient) {
  return {
    findUserByEmail(email: string) {
      return prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, passwordHash: true },
      });
    },
    createSession(data: { userId: string; sessionTokenHash: string; sessionExpiresAt: Date }) {
      return prisma.session.create({
        data: { userId: data.userId, tokenHash: data.sessionTokenHash, expiresAt: data.sessionExpiresAt },
        select: { id: true },
      });
    },
    async register(data: RegisterInput & { passwordHash: string; sessionTokenHash: string; sessionExpiresAt: Date }) {
      return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: data.email,
            name: data.name,
            passwordHash: data.passwordHash,
            settings: { create: { developerRate: 0 } },
          },
          select: { id: true, email: true, name: true },
        });

        await initializeDefaultCatalog(tx, user.id);
        await tx.session.create({
          data: {
            userId: user.id,
            tokenHash: data.sessionTokenHash,
            expiresAt: data.sessionExpiresAt,
          },
        });

        return user;
      });
    },
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
