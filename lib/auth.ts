import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "./prisma";

const COOKIE_NAME = "uid";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function hashPin(pin: string, aliasLower: string) {
  // เดโม่: SHA-256 (งานจริงควรใช้ bcrypt/scrypt + salt)
  return crypto.createHash("sha256").update(`${aliasLower}:${pin}`).digest("hex");
}

/**
 * ตั้ง session cookie บน NextResponse (ใช้ใน route handlers)
 */
export function setSessionCookie(res: NextResponse, userId: number) {
  res.cookies.set(COOKIE_NAME, String(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
}

/**
 * ลบ session cookie บน NextResponse
 */
export function clearSessionCookie(res: NextResponse) {
  // ตั้ง maxAge=0 เพื่อลบทิ้ง
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0, sameSite: "lax" });
}

/**
 * อ่าน session จากคุกกี้ของ request ปัจจุบัน
 */
export async function getSessionUser() {
  const jar = await cookies(); // ← ในเวอร์ชันนี้ต้อง await
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const id = Number(raw);
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}
