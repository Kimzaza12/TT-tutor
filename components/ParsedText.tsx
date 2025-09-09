'use client';
import React from 'react';

type YTInfo = { id: string; embed: string };

function timeToSeconds(t?: string | null): number {
  if (!t) return 0;
  const str = String(t);
  if ([...str].every((ch) => ch >= '0' && ch <= '9')) return parseInt(str, 10);
  let s = 0, num = '';
  for (const ch of str) {
    if (ch >= '0' && ch <= '9') { num += ch; continue; }
    if (ch === 'h') { s += (num ? parseInt(num, 10) : 0) * 3600; num = ''; }
    else if (ch === 'm') { s += (num ? parseInt(num, 10) : 0) * 60; num = ''; }
    else if (ch === 's') { s += (num ? parseInt(num, 10) : 0); num = ''; }
  }
  if (num) s += parseInt(num, 10);
  return s;
}

function parseYouTube(url: string): YTInfo | null {
  try {
    const u = new URL(url);
    const host = u.hostname.startsWith('www.') ? u.hostname.slice(4) : u.hostname;
    let id: string | null = null;

    if (host === 'youtu.be') {
      id = u.pathname.split('/').filter(Boolean)[0] || null;
    } else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2];
      else if (u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2];
      else if (u.pathname.startsWith('/live/')) id = u.pathname.split('/')[2];
    }
    if (!id) return null;

    const start = timeToSeconds(u.searchParams.get('start') || u.searchParams.get('t'));
    const embed = 'https://www.youtube.com/embed/' + id + '?rel=0' + (start ? '&start=' + start : '');
    return { id, embed };
  } catch {
    return null;
  }
}

export default function ParsedText({
  text,
  onTagClick,
}: {
  text: string;
  onTagClick?: (tag: string) => void;
}) {
  const nodes: React.ReactNode[] = [];
  const lines = (text || '').split(String.fromCharCode(10));
  let firstYT: YTInfo | null = null;

  lines.forEach((line, li) => {
    const words = line.split(' ');
    const para: React.ReactNode[] = [];
    words.forEach((w, wi) => {
      const hasHttp = w.startsWith('http://') || w.startsWith('https://');
      const isTag = w.startsWith('#') && w.length > 1;
      if (hasHttp) {
        const yt = parseYouTube(w);          // ← ตอนนี้ type เป็น YTInfo | null
        if (yt && !firstYT) firstYT = yt;    // ← firstYT เป็น YTInfo | null ชัดเจน
        para.push(
          <a key={'u' + li + '-' + wi} href={w} target="_blank" rel="noopener noreferrer" className="underline break-all">
            {w}
          </a>
        );
      } else if (isTag) {
        para.push(
          <button
            key={'h' + li + '-' + wi}
            type="button"
            className="inline text-blue-600 hover:underline"
            onClick={() => onTagClick && onTagClick(w)}
            title={'กรองด้วย ' + w}
          >
            {w}
          </button>
        );
      } else {
        para.push(<span key={'t' + li + '-' + wi}>{w}</span>);
      }
      if (wi < words.length - 1) para.push(' ');
    });
    nodes.push(
      <p key={'l' + li} className="whitespace-pre-wrap break-words mt-1 first:mt-0">
        {para}
      </p>
    );
  });

  if (firstYT) {
    const { id, embed } = firstYT; // ← ช่วยให้ TS แคบชนิดชัดเจน
    nodes.push(
      <div key={`yt-${id}`} className="mt-2 rounded-xl overflow-hidden border border-gray-200">
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={embed}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return <div className="mt-1 text-gray-800">{nodes}</div>;
}
