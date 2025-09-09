// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// ป้องกันสร้าง PrismaClient ซ้ำ ๆ ตอน dev (HMR)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // เปิด log ชั่วคราวได้ถ้าดีบัก: log: ["query", "error", "warn"]
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
