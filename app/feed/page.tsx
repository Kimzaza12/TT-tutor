'use client';
import React from 'react';
import Avatar from '@/components/Avatar';
import ParsedText from '@/components/ParsedText';
import { useRouter } from 'next/navigation';

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

function getCookie(name: string) {
  return document.cookie.split('; ').find((row) => row.startsWith(name + '='))?.split('=')[1];
}

export default function FeedPage() {
  const router = useRouter();
  const [alias, setAlias] = React.useState('');
  const [text, setText] = React.useState('');
  const [filter, setFilter] = React.useState('');
  const [error, setError] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [pending, setPending] = React.useState<Record<number, boolean>>({});
  const timersRef = React.useRef<Record<number, any>>({});

  React.useEffect(() => {
    const a = decodeURIComponent(getCookie('alias') || '').trim() || JSON.parse(localStorage.getItem('alias') || '""');
    if (!a) { router.push('/alias'); return; }
    setAlias(a);
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    const res = await fetch('/api/messages', { cache: 'no-store' });
    const data: Message[] = await res.json();
    setMessages(data);
  }

  const visible = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    const flat: Message[] = [];
    for (const m of messages) {
      flat.push(m);
      if (m.replies) flat.push(...m.replies);
    }
    return q
      ? flat.filter((m) => (m.alias || '').toLowerCase().includes(q) || (m.text || '').toLowerCase().includes(q))
      : flat;
  }, [messages, filter]);

  const roots = React.useMemo(
    () => messages.filter((m) => !m.parentId && (!m.softDeleted || pending[m.id])),
    [messages, pending]
  );

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const t = text.trim();
    if (!t) { setError('พิมพ์ข้อความที่จะระบายก่อนนะ'); return; }
    await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alias, text }) });
    setText('');
    await refresh();
  }

  async function submitReply(parentId: number, replyText: string) {
    const t = replyText.trim();
    if (!t) return;
    await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alias, text: t, parentId }) });
    await refresh();
  }

  async function toggleLike(id: number) {
    await fetch(`/api/messages/${id}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alias }) });
    await refresh();
  }

  function softDelete(id: number) {
    if (pending[id]) return;
    timersRef.current[id] = setTimeout(async () => {
      await fetch(`/api/messages/${id}/soft-delete`, { method: 'POST' });
      setPending((p) => { const { [id]: _, ...rest } = p; return rest; });
      await refresh();
    }, 5000);
    setPending((p) => ({ ...p, [id]: true }));
  }
  function undoDelete(id: number) {
    if (!pending[id]) return;
    clearTimeout(timersRef.current[id]);
    const copy = { ...pending }; delete copy[id]; setPending(copy);
  }

  function timeFormat(iso: string) {
    try { return new Date(iso).toLocaleString('th-TH', { hour12: false }); } catch { return iso; }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">พื้นที่ระบายความในใจ 💬</h1>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-gray-600">เข้าสู่ระบบในนาม <b>{alias}</b></span>
            <button onClick={() => router.push('/alias')} className="text-sm bg-gray-200 hover:bg-gray-300 rounded-xl px-3 py-1">เปลี่ยนนามแฝง</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 mb-6">
          <form onSubmit={submitPost} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ข้อความที่จะระบาย</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="พิมพ์เลย... ใส่ #แฮชแท็ก ได้ และวางลิงก์ YouTube จะฝังคลิปอัตโนมัติ" rows={3}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex items-center justify-end gap-2">
              <button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 shadow-sm">ส่งข้อความ</button>
            </div>
          </form>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex-1">
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="ค้นหาโดยนามแฝงหรือข้อความ... หรือคลิก #แฮชแท็ก ในโพสต์"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="text-sm text-gray-500">ปุ่มอยู่ขวา ชื่อ/ข้อความอยู่ซ้ายตามสไตล์ที่ชอบ 😉</div>
        </div>

        <div className="space-y-3">
          {roots.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center text-gray-500 shadow-sm">ยังไม่มีข้อความ ลองพิมพ์ด้านบนได้เลย</div>
          )}

          {roots.map((m) => (
            <article key={m.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-start gap-3">
                <Avatar alias={m.alias} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="truncate">
                      <span className="font-semibold text-gray-900">{m.alias}</span>
                      <time className="ml-2 text-xs text-gray-500">{timeFormat(m.createdAt)}</time>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button type="button" onClick={() => toggleLike(m.id)} disabled={!alias || pending[m.id] || m.softDeleted}
                        className={`px-3 py-1 rounded-xl border text-sm ${(m.likedByAliases || []).includes(alias) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                        💟 {(m.likedByAliases || []).length}
                      </button>
                      <button type="button" onClick={() => softDelete(m.id)} disabled={pending[m.id] || m.softDeleted}
                        className="px-3 py-1 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-red-50">
                        ลบ
                      </button>
                    </div>
                  </div>

                  {pending[m.id] ? (
                    <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between">
                      <span>โพสต์นี้ถูกลบชั่วคราว — ยกเลิกภายในไม่กี่วินาที</span>
                      <button type="button" onClick={() => undoDelete(m.id)} className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm">ยกเลิกการลบ</button>
                    </div>
                  ) : m.softDeleted ? (
                    <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500">โพสต์ถูกซ่อนไว้ (ลบแบบชั่วคราว)</div>
                  ) : (
                    <ParsedText text={m.text} onTagClick={(tag) => setFilter(tag.toLowerCase())} />
                  )}

                  <Replies me={alias} parent={m} onReply={submitReply} onLike={toggleLike} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function Replies({ me, parent, onReply, onLike }: {
  me: string;
  parent: Message;
  onReply: (parentId: number, text: string) => Promise<void>;
  onLike: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen((v) => !v)} className="px-3 py-1 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
          ตอบกลับ {parent.replies?.length ? `(${parent.replies.length})` : ''}
        </button>
      </div>

      {open && (
        <form onSubmit={async (e) => { e.preventDefault(); await onReply(parent.id, text); setText(''); setOpen(false); }} className="mt-3">
          <label className="block text-sm text-gray-700 mb-1">ตอบกลับในนาม <b>{me}</b></label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="พิมพ์คำตอบ..." rows={2}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1 rounded-xl border border-gray-300 text-sm text-gray-700">ยกเลิก</button>
            <button type="submit" className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm">ส่งคำตอบ</button>
          </div>
        </form>
      )}

      {(parent.replies || []).map((r) => (
        <div key={r.id} className="flex items-start gap-2 pl-12 mt-2">
          <Avatar alias={r.alias} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="truncate">
                <span className="font-medium text-gray-900">{r.alias}</span>
                <time className="ml-2 text-xs text-gray-500">{new Date(r.createdAt).toLocaleString('th-TH', { hour12: false })}</time>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <button type="button" onClick={() => onLike(r.id)} className={`px-2 py-1 rounded-lg border text-xs ${(r.likedByAliases || []).includes(me) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>💟 {(r.likedByAliases || []).length || 0}</button>
              </div>
            </div>
            <ParsedText text={r.text} onTagClick={() => {}} />
          </div>
        </div>
      ))}
    </div>
  );
}
