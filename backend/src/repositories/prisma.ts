import dotenv from 'dotenv';
dotenv.config(); // Garantir que as variáveis de ambiente são carregadas

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();