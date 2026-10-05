import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../prisma/client.js";
import { initializeDefaultCatalog } from "./default-catalog.js";

type NewUser = Pick<Prisma.UserCreateInput, "email" | "name" | "passwordHash">;

/** User creation entry point: user and owned defaults commit or roll back together. */
export async function createUserWithDefaultCatalog(data: NewUser) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data });
    await initializeDefaultCatalog(tx, user.id);
    return user;
  });
}
