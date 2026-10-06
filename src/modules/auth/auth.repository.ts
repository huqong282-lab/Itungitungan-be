import type { PrismaClient } from "../../generated/prisma/client.js";
import type { AuthUser } from "./auth.types.js";

export type StoredAuthUser = AuthUser & { passwordHash: string };

/** Database access for auth. HTTP and credential policy belong to higher layers. */
export function createAuthRepository(prisma: PrismaClient) {
  return {
    findUserByEmail(email: string): Promise<StoredAuthUser | null> {
      return prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, passwordHash: true },
      });
    },
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
