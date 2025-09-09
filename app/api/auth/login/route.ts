import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, hashPin, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { alias?: unknown; pin?: unknown };

export async function POST(req: Request) {
  let alias = "";
  let pin = "";
  try {
    const b = (await req.json()) as Body;
    if (typeof b.alias === "string") alias = b.alias.trim();
    if (typeof b.pin === "string") pin = b.pin.trim();
  } catch {
    // ไม่มี body ก็จะตกมาเช็กด้านล่าง
  }

  if (!alias) return NextResponse.json({ error: "missing alias" }, { status: 400 });
  if (!pin) return NextResponse.json({ error: "missing pin" }, { status: 400 });

  const aliasLower = alias.toLowerCase();

  // หา user เดิมก่อน
  const user = await prisma.user.findUnique({ where: { aliasLower } });

  if (!user) {
    // ไม่เคยตั้ง -> สมัครใหม่ + ล็อกอิน
    const created = await prisma.user.create({
      data: {
        alias,
        aliasLower,
        pinHash: hashPin(pin, aliasLower),
      },
    });
    const res = NextResponse.json({ ok: true, alias: created.alias, created: true }, { status: 201 });
    res.cookies.set(COOKIE_NAME, String(created.id), sessionCookieOptions());
    return res;
  }

  // เคยตั้งแล้ว -> ตรวจ PIN
  const ok = user.pinHash === hashPin(pin, aliasLower);
  if (!ok) {
    return NextResponse.json({ error: "wrong pin" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, alias: user.alias, created: false });
  res.cookies.set(COOKIE_NAME, String(user.id), sessionCookieOptions());
  return res;
}
