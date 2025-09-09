import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ alias: null }, { status: 200 });
  return NextResponse.json({ alias: user.alias }, { status: 200 });
}
