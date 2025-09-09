import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sseBroadcast } from "@/lib/sse";

/** ------- minimal types ที่ตรงกับ include ------- */
type LikeWithUserRow = { user: { alias: string } };
type ReplyRow = {
  id: number; alias: string; text: string; createdAt: Date;
  softDeleted: boolean; parentId: number | null; likes: LikeWithUserRow[];
};
type MessageRow = ReplyRow & { replies: ReplyRow[] };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  const raw = await prisma.message.findMany({
    where: { parentId: null },
    include: {
      user: true,
      likes: { include: { user: true } },
      replies: {
        where: { softDeleted: false },
        orderBy: { createdAt: "asc" },
        include: { user: true, likes: { include: { user: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const messages = raw as unknown as MessageRow[];

  const mapped = messages.map((m) => ({
    id: m.id,
    alias: m.alias,
    text: m.text,
    createdAt: m.createdAt,
    softDeleted: m.softDeleted,
    parentId: m.parentId,
    likedByAliases: m.likes.map((l) => l.user.alias),
    replies: m.replies.map((r) => ({
      id: r.id,
      alias: r.alias,
      text: r.text,
      createdAt: r.createdAt,
      softDeleted: r.softDeleted,
      parentId: r.parentId,
      likedByAliases: r.likes.map((l) => l.user.alias),
    })),
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 👇 ป้องกัน body ว่าง/ไม่ใช่ JSON
  let payload: any = {};
  try {
    // ถ้ามี body และเป็น JSON ถึงจะ parse; ถ้าว่าง จะเข้า catch แล้วปล่อยเป็น {}
    payload = await req.json();
  } catch {
    payload = {};
  }

  const text = (payload?.text ?? "").toString().trim();
  const parentId = payload?.parentId != null ? Number(payload.parentId) : null;

  if (!text) {
    return NextResponse.json({ error: "missing text" }, { status: 400 });
  }
  if (parentId !== null && (!Number.isFinite(parentId) || parentId <= 0)) {
    return NextResponse.json({ error: "invalid parentId" }, { status: 400 });
  }

  const created = await prisma.message.create({
    data: {
      userId: user.id,
      alias: user.alias,
      text,
      parentId,
    },
  });

  // แจ้งทุก client ให้รีเฟรช (โพสต์/คอมเมนต์ใหม่)
  sseBroadcast("message:new", { id: created.id, parentId: created.parentId });

  return NextResponse.json(created, { status: 201 });
}
