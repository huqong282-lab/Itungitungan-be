import { prisma } from "./infrastructure/prisma/client.js";

const user = await prisma.user.findFirst();

console.log("Prisma connection OK");
console.log("User:", user);