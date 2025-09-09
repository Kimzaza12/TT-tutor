import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId");
  const where = parentId ? { parentId: Number(parentId), softDeleted: false } : { parentId: null };
  const include = parentId
    ? { likes: true }
    : { likes: true, replies: { where: { softDeleted: false }, include: { likes: true }, orderBy: { createdAt: "asc" } } };

  const messages = await prisma.message.findMany({ where, include, orderBy: { createdAt: "desc" } });

  const mapped = messages.map((m: any) => ({
    ...m,
    likedByAliases: m.likes.map((l: any) => l.alias),
    likes: undefined,
    replies: m.replies
      ? m.replies.map((r: any) => ({ ...r, likedByAliases: r.likes.map((l: any) => l.alias), likes: undefined }))
      : undefined,
  }));

  return NextResponse.json(mapped);
}

export async function POST(request: Request) {
  const body = await request.json();
  const alias = String(body.alias || "").trim();
  const text = String(body.text || "").trim();
  const parentId = body.parentId ? Number(body.parentId) : null;
  if (!alias || !text) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const created = await prisma.message.create({ data: { alias, text, parentId } });
  return NextResponse.json(created, { status: 201 });
}
