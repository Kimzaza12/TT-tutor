'use client';
import React from "react";

export default function Avatar({ alias }: { alias: string }) {
  const letter = (alias || "?").trim().charAt(0).toUpperCase();
  const hue = React.useMemo(() => {
    let h = 0;
    for (let i = 0; i < alias.length; i++) h = (h * 31 + alias.charCodeAt(i)) % 360;
    return h;
  }, [alias]);

  return (
    <div
      className="h-10 w-10 shrink-0 rounded-full grid place-items-center text-white font-semibold"
      style={{ background: `hsl(${hue} 70% 45%)` }}
      title={alias}
    >
      {letter || "?"}
    </div>
  );
}
