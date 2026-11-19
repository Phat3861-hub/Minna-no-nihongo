"use client";

import Link from "next/link";
import type { KanjiItem } from "@/lib/types";

/** Giải thích từng chữ kanji có trong một từ: Hán Việt, nghĩa, âm On/Kun, bài */
export default function KanjiExplain({
  word,
  byId,
  title = "Giải thích chữ kanji",
  skip,
}: {
  word: string;
  byId: Map<string, KanjiItem>;
  title?: string;
  skip?: string;
}) {
  const seen = new Set<string>();
  const rows = Array.from(word).filter((c) => {
    if (!byId.has(c) || seen.has(c) || (skip && skip.includes(c))) return false;
    seen.add(c);
    return true;
  });
  if (!rows.length) return null;
  return (
    <div className="why">
      <span className="why-h">{title}</span>
      <ul className="kx">
        {rows.map((c) => {
          const o = byId.get(c)!;
          return (
            <li key={c}>
              <span className="kx-k">{o.char}</span>
              <span className="kx-b">
                <span>
                  <b>{o.hanViet}</b> · {o.meaning}
                </span>
                <span className="kx-r">
                  On: {o.on} · Kun: {o.kun} · <Link href={`/kanji?chu=${encodeURIComponent(c)}`}>Kanji {o.groupName}</Link>
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
