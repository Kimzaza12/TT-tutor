'use client';
import { useRouter } from "next/navigation";
import React from "react";

export default function AliasPage() {
  const router = useRouter();
  const [alias, setAlias] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState("");

  async function submit() {
    setError("");
    const a = alias.trim();
    const p = pin.trim();
    if (!a) return setError("กรุณาใส่นามแฝง");
    if (!/^\d{4}$/.test(p)) return setError("กรุณาใส่รหัส 4 หลัก (ตัวเลข)");

    // ลองล็อกอินก่อน ถ้าไม่เจอค่อยสมัคร
    let res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias: a, pin: p }),
    });

    if (res.status === 404) {
      // สมัครครั้งแรก
      res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: a, pin: p }),
      });
    }

    if (!res.ok) {
      const msg = await res.json().catch(() => ({}));
      return setError(msg?.error || "เกิดข้อผิดพลาด");
    }

    // เก็บ alias ฝั่ง client เพื่อแสดงผล (สิทธิ์จริงดูจาก cookie)
    localStorage.setItem("alias", JSON.stringify(a));
    router.push("/feed");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-xl mx-auto px-4">
        <h1 className="text-3xl font-bold">ตั้งค่านามแฝง 👤</h1>
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4 mt-4">
          <label className="block text-sm font-medium">นามแฝง</label>
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full rounded-xl border border-gray-300 px-3 py-2"
            placeholder="เช่น แมวหลับ, สุดหล่อ, ฯลฯ"
          />

          <label className="block text-sm font-medium mt-2">รหัส 4 หลัก</label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            inputMode="numeric"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 tracking-widest"
            placeholder="เช่น 1234"
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end">
            <button onClick={submit} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">
              ไปหน้าถัดไป
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
