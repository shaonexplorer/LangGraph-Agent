import { PostgresClient } from "@prisma/orm-postgres/runtime";
import { db } from "../prisma/db";

import { NoCollectionClasses } from "@prisma/orm-postgres/orm-client";
import { Contract } from "../prisma/contract";

const globalForPrisma = globalThis;

// Reuse the PrismaClient instance if it already exists in the global scope
export const prisma: PostgresClient<Contract, NoCollectionClasses> =
  globalForPrisma.prisma || db;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
