import { sseConnect } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return sseConnect();
}
