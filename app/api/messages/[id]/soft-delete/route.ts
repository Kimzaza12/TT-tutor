import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  await prisma.message.update({ where: { id }, data: { softDeleted: true } });
  return NextResponse.json({ ok: true });
}
