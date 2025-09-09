import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const COOKIE_NAME = "uid";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function hashPin(pin: string, aliasLower: string) {
  // เดโม่: SHA-256 (โปรดักชันจริงใช้ bcrypt/scrypt + salt)
  return crypto.createHash("sha256").update(`${aliasLower}:${pin}`).digest("hex");
}

export async function getSessionUser() {
  // ใน Next 15 ควร await cookies() ให้ชัวร์ทุก runtime
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isFinite(id)) return null;
  return prisma.user.findUnique({ where: { id } });
}

export function sessionCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/" as const,
    maxAge: ONE_YEAR,
  };
}
