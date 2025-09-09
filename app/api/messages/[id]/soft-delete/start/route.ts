import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sseBroadcast } from "@/lib/sse";

const PENDING_MS = 5000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const msgId = Number(id);
  if (!Number.isFinite(msgId) || msgId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const msg = await prisma.message.findUnique({ where: { id: msgId } });
  if (!msg) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (msg.userId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const until = Date.now() + PENDING_MS;
  sseBroadcast("message:pendingDelete", { id: msgId, until });

  return NextResponse.json({ id: msgId, until });
}
