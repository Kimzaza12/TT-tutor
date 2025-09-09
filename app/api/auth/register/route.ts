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
  } catch {}

  if (!alias) return NextResponse.json({ error: "missing alias" }, { status: 400 });
  if (!pin) return NextResponse.json({ error: "missing pin" }, { status: 400 });

  const aliasLower = alias.toLowerCase();

  const exists = await prisma.user.findUnique({ where: { aliasLower } });
  if (exists) {
    return NextResponse.json({ error: "alias already exists" }, { status: 409 });
  }

  const created = await prisma.user.create({
    data: {
      alias,
      aliasLower,
      pinHash: hashPin(pin, aliasLower),
    },
  });

  const res = NextResponse.json({ ok: true, alias: created.alias }, { status: 201 });
  res.cookies.set(COOKIE_NAME, String(created.id), sessionCookieOptions());
  return res;
}
