import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const alias = String(body.alias || "").trim();
  const id = Number(params.id);
  if (!alias || !id) return NextResponse.json({ error: "missing" }, { status: 400 });

  const existing = await prisma.like.findUnique({ where: { messageId_alias: { messageId: id, alias } } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { messageId: id, alias } });
  }
  return NextResponse.json({ ok: true });
}
