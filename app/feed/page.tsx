'use client';

import React from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import ParsedText from "@/components/ParsedText";

type Message = {
  id: number;
  alias: string;
  text: string;
  createdAt: string;
  softDeleted: boolean;
  parentId: number | null;
  likedByAliases: string[];
  replies?: Message[];
};

function useMe() {
  const [alias, setAlias] = React.useState<string | null>(null);
  React.useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAlias(d?.alias ?? null))
      .catch(() => setAlias(null));
  }, []);
  return alias;
}

export default function FeedPage() {
  const router = useRouter();
  const alias = useMe();
  const [text, setText] = React.useState("");
  const [filter, setFilter] = React.useState("");
  const [error, setError] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  // pending ลบ: map<messageId, untilEpochMs>
  const [pending, setPending] = React.useState<Record<number, number>>({});
  const timersRef = React.useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  React.useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ alias: null }));
      if (!me?.alias) { router.push("/alias"); return; }
      await refresh();
    })();
  }, [router]);

  async function refresh() {
    const data: Message[] = await fetch("/api/messages", { cache: "no-store" }).then((r) => r.json());
    setMessages(data);
  }

  // 🔴 เปิด SSE และทำงานเมื่อมีอีเวนต์
  React.useEffect(() => {
    const es = new EventSource("/api/stream");

    const onRefresh = () => { refresh(); };

    es.addEventListener("message:new", onRefresh);
    es.addEventListener("like:toggled", onRefresh);

    es.addEventListener("message:softDeleted", (ev) => {
      try {
        const parsed = JSON.parse(String((ev as MessageEvent).data)) as { id: number };
        setPending((p) => { const n = { ...p }; delete n[parsed.id]; return n; });
      } catch {}
      refresh();
    });

    es.addEventListener("message:pendingDelete", (ev) => {
      try {
        const parsed = JSON.parse(String((ev as MessageEvent).data)) as { id: number; until: number };
        setPending((p) => ({ ...p, [parsed.id]: parsed.until }));
      } catch {}
    });

    es.addEventListener("message:pendingCancel", (ev) => {
      try {
        const parsed = JSON.parse(String((ev as MessageEvent).data)) as { id: number };
        setPending((p) => { const n = { ...p }; delete n[parsed.id]; return n; });
      } catch {}
    });

    es.onerror = () => { /* ให้ browser reconnect เอง */ };

    return () => es.close();
  }, []);

  const roots = React.useMemo(
    () => messages.filter((m) => !m.parentId && (!m.softDeleted || pending[m.id])),
    [messages, pending]
  );

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const t = text.trim();
    if (!t) return setError("พิมพ์ข้อความก่อนนะ");
    const ok = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t }),
    });
    if (!ok.ok) { setError("โพสต์ไม่สำเร็จ"); return; }
    setText("");
    // รอ SSE อัปเดต
  }

  async function submitReply(parentId: number, replyText: string) {
    const t = replyText.trim();
    if (!t) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t, parentId }),
    });
    // รอ SSE อัปเดต
  }

  async function toggleLike(id: number) {
    await fetch(`/api/messages/${id}/like`, { method: "POST" });
    // รอ SSE อัปเดต
  }

  // เริ่มลบ (pending + broadcast) แล้วตั้ง timer ฝั่งเจ้าของเพื่อ commit หลัง 5 วิ
  async function softDelete(id: number, ownerAlias: string) {
    if (!alias || alias !== ownerAlias) {
      alert("คุณสามารถลบได้เฉพาะโพสต์/คอมเมนต์ของตนเอง");
      return;
    }
    if (pending[id]) return;

    const res = await fetch(`/api/messages/${id}/soft-delete/start`, { method: "POST" });
    if (!res.ok) { alert("เริ่มลบไม่สำเร็จ"); return; }
    const { until } = await res.json() as { until: number };
    setPending((p) => ({ ...p, [id]: until }));

    const ms = Math.max(0, until - Date.now());
    const tid = setTimeout(async () => {
      await fetch(`/api/messages/${id}/soft-delete`, { method: "POST" });
      delete timersRef.current[id];
    }, ms);
    timersRef.current[id] = tid;
  }

  // ยกเลิกลบ (broadcast cancel) และล้าง timer ฝั่งเจ้าของ
  async function undoDelete(id: number) {
    if (!pending[id]) return;
    await fetch(`/api/messages/${id}/soft-delete/cancel`, { method: "POST" });
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setPending((p) => { const n = { ...p }; delete n[id]; return n; });
  }

  function time(iso: string) {
    try { return new Date(iso).toLocaleString("th-TH", { hour12: false }); } catch { return iso; }
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">พื้นที่ระบายความในใจ 💬</h1>
          <div className="text-sm text-gray-600">เข้าสู่ระบบในนาม <b>{alias ?? "-"}</b></div>
        </header>

        <section className="bg-white rounded-2xl shadow-sm p-4 md:p-6 mb-6">
          <form onSubmit={submitPost} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">ข้อความที่จะระบาย</label>
              <textarea
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="พิมพ์เลย... ใส่ #แฮชแท็ก ได้ และวางลิงก์ YouTube จะฝังคลิปอัตโนมัติ"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end">
              <button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">ส่งข้อความ</button>
            </div>
          </form>
        </section>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="ค้นหา... หรือกด #แฮชแท็ก เพื่อกรอง"
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-3">
          {roots.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center text-gray-500 shadow-sm">ยังไม่มีข้อความ</div>
          )}

          {roots
            .filter((m) => {
              const q = filter.trim().toLowerCase();
              if (!q) return true;
              return m.alias.toLowerCase().includes(q) || m.text.toLowerCase().includes(q);
            })
            .map((m) => (
              <article key={m.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <Avatar alias={m.alias} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="truncate">
                        <span className="font-semibold">{m.alias}</span>
                        <time className="ml-2 text-xs text-gray-500">{time(m.createdAt)}</time>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => toggleLike(m.id)}
                          className={`px-3 py-1 rounded-xl border text-sm ${
                            (m.likedByAliases || []).includes(alias || "")
                              ? "border-blue-300 bg-blue-50 text-blue-700"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          💟 {(m.likedByAliases || []).length}
                        </button>

                        {/* ลบได้เฉพาะเจ้าของ */}
                        {!m.softDeleted && alias === m.alias && (
                          pending[m.id] ? (
                            <button
                              onClick={() => undoDelete(m.id)}
                              className="px-3 py-1 rounded-xl border border-amber-300 text-sm text-amber-800 bg-amber-50"
                            >
                              ยกเลิกการลบ
                            </button>
                          ) : (
                            <button
                              onClick={() => softDelete(m.id, m.alias)}
                              className="px-3 py-1 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-red-50"
                            >
                              ลบ
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* เนื้อหา + pending/undo */}
                    {pending[m.id] ? (
                      <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between">
                        <span>โพสต์นี้กำลังจะถูกลบ — ยกเลิกได้ภายในไม่กี่วินาที</span>
                        <button
                          onClick={() => undoDelete(m.id)}
                          className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm"
                        >
                          ยกเลิกการลบ
                        </button>
                      </div>
                    ) : m.softDeleted ? (
                      <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500">
                        โพสต์ถูกซ่อนไว้
                      </div>
                    ) : (
                      <ParsedText text={m.text} onTagClick={(tag) => setFilter(tag.toLowerCase())} />
                    )}

                    {/* replies */}
                    {(m.replies || []).length > 0 && (
                      <div className="mt-3 space-y-2">
                        {m.replies!.map((r) => (
                          <div key={r.id} className="flex items-start gap-2 pl-12">
                            <Avatar alias={r.alias} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3">
                                <div className="truncate">
                                  <span className="font-medium">{r.alias}</span>
                                  <time className="ml-2 text-xs text-gray-500">{time(r.createdAt)}</time>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                  <button
                                    onClick={() => toggleLike(r.id)}
                                    className={`px-2 py-1 rounded-lg border text-xs ${
                                      (r.likedByAliases || []).includes(alias || "")
                                        ? "border-blue-300 bg-blue-50 text-blue-700"
                                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                                  >
                                    💟 {(r.likedByAliases || []).length || 0}
                                  </button>

                                  {/* ลบได้เฉพาะเจ้าของคอมเมนต์ */}
                                  {!r.softDeleted && alias === r.alias && (
                                    pending[r.id] ? (
                                      <button
                                        onClick={() => undoDelete(r.id)}
                                        className="px-2 py-1 rounded-lg border border-amber-300 text-xs text-amber-800 bg-amber-50"
                                      >
                                        ยกเลิกการลบ
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => softDelete(r.id, r.alias)}
                                        className="px-2 py-1 rounded-lg border border-gray-300 text-xs text-gray-700 hover:bg-red-50"
                                      >
                                        ลบ
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                              {pending[r.id] ? (
                                <div className="mt-1 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between">
                                  <span>ตอบกลับนี้กำลังจะถูกลบ</span>
                                  <button
                                    onClick={() => undoDelete(r.id)}
                                    className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs"
                                  >
                                    ยกเลิกการลบ
                                  </button>
                                </div>
                              ) : r.softDeleted ? (
                                <div className="mt-1 p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500">
                                  คอมเมนต์ถูกซ่อนไว้
                                </div>
                              ) : (
                                <ParsedText text={r.text} onTagClick={(tag) => setFilter(tag.toLowerCase())} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* reply input */}
                    <ReplyBox onSubmit={(t) => submitReply(m.id, t)} me={alias || ""} />
                  </div>
                </div>
              </article>
            ))}
        </div>
      </div>
    </main>
  );
}

function ReplyBox({ onSubmit, me }: { onSubmit: (text: string) => void; me: string }) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  if (!me) return null;
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-1 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
        >
          ตอบกลับ
        </button>
      </div>
      {open && (
        <form
          onSubmit={(e) => { e.preventDefault(); const t = text.trim(); if (!t) return; onSubmit(t); setText(""); setOpen(false); }}
          className="mt-2"
        >
          <label className="block text-sm text-gray-700 mb-1">ตอบกลับในนาม <b>{me}</b></label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="พิมพ์คำตอบ..."
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1 rounded-xl border border-gray-300 text-sm text-gray-700">ยกเลิก</button>
            <button type="submit" className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm">ส่งคำตอบ</button>
          </div>
        </form>
      )}
    </div>
  );
}
