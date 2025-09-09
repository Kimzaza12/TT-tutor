'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AliasPage() {
  const [alias, setAlias] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  function saveAlias() {
    const a = alias.trim();
    if (!a) { setError('กรุณาใส่นามแฝงก่อน'); return; }
    document.cookie = `alias=${encodeURIComponent(a)}; path=/; max-age=31536000`;
    localStorage.setItem('alias', JSON.stringify(a));
    router.push('/feed');
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-xl mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">ตั้งค่านามแฝง 👤</h1>
          <p className="text-gray-600 mt-1">ตั้งชื่อนามแฝงเพื่อใช้แสดงในหน้าโพสต์ข้อความ</p>
        </header>
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <label className="block text-sm font-medium text-gray-700">นามแฝง</label>
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveAlias(); } }}
            placeholder="เช่น แมวหลับ, Kim, ฯลฯ"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex items-center justify-end">
            <button onClick={saveAlias} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 shadow-sm">
              ไปหน้าถัดไป
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">* จะเก็บนามแฝงไว้ใน cookie + localStorage</p>
      </div>
    </div>
  );
}
