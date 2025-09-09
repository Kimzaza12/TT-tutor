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

  const existed = await prisma.user.findUnique({ where: { aliasLower } });
  if (existed) {
    return NextResponse.json({ error: "alias already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { alias: a, aliasLower, pinHash: hashPin(p, aliasLower) },
  });

  const res = NextResponse.json({ alias: user.alias }, { status: 201 });
  setSessionCookie(res, user.id);   // ← ตั้งคุกกี้บน response
  return res;
}
