// src/lib/sse.ts
const encoder = new TextEncoder();

type Client = { id: number; ctrl: ReadableStreamDefaultController<Uint8Array> };
const clients = new Set<Client>();
let nextId = 1;

/** เปิดการเชื่อมต่อ SSE */
export function sseConnect(): Response {
  const id = nextId++;
  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      clients.add({ id, ctrl });
      // keep-alive แรกเริ่ม
      ctrl.enqueue(encoder.encode(`: connected ${Date.now()}\n\n`));
    },
    cancel() {
      for (const c of clients) if (c.id === id) clients.delete(c);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}

/** กระจายอีเวนต์ไปยังทุก client */
export function sseBroadcast(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const chunk = encoder.encode(payload);
  for (const c of clients) {
    try { c.ctrl.enqueue(chunk); } catch { clients.delete(c); }
  }
}
