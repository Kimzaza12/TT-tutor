import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPin, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { alias, pin } = await req.json();
  const a = String(alias || "").trim();
  const p = String(pin || "").trim();
  if (!a || !/^\d{4}$/.test(p)) {
    return NextResponse.json({ error: "invalid alias or pin" }, { status: 400 });
  }

  const aliasLower = a.toLowerCase();
  const user = await prisma.user.findUnique({ where: { aliasLower } });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });
  if (user.pinHash !== hashPin(p, aliasLower)) {
    return NextResponse.json({ error: "wrong pin" }, { status: 401 });
  }

  const res = NextResponse.json({ alias: user.alias }, { status: 200 });
  setSessionCookie(res, user.id);   // ← ตั้งคุกกี้บน response
  return res;
}
