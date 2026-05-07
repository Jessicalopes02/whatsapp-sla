import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Instanciando o Prisma Client sem o adapter
export const prisma = new PrismaClient();