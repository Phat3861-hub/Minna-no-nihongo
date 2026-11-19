"use client";

import Link from "next/link";
import type { KanjiBrief } from "@/lib/types";
import { kanjiChars } from "@/lib/utils";

/**
 * Tách từng chữ kanji trong một từ và cho biết chữ đó thuộc Bài mấy trong giáo trình Kanji.
 * Bấm vào chữ để mở trang Kanji tại đúng chữ đó.
 */
export default function KanjiBreakdown({
  text,
  index,
  align = "center",
  compact = false,
}: {
  text: string;
  index: Record<string, KanjiBrief>;
  align?: "center" | "left";
  compact?: boolean;
}) {
  const chars = kanjiChars(text);
  if (!chars.length) return null;
  return (
    <div className={"kb-list" + (align === "left" ? " left" : "")} onClick={(e) => e.stopPropagation()}>
      {chars.map((c) => {
        const k = index[c];
        if (!k)
          return (
            <span key={c} className="kb-chip none" title="Chữ này chưa có trong bảng kanji của giáo trình">
              <span className="k">{c}</span>
              {!compact && (
                <span>
                  <small>Chưa có trong</small>
                  <small>bảng kanji</small>
                </span>
              )}
            </span>
          );
        return (
          <Link
            key={c}
            href={`/kanji?chu=${encodeURIComponent(c)}`}
            className="kb-chip"
            title={`${c} · ${k.hanViet} · ${k.meaning} · Kanji ${k.groupName}`}
          >
            <span className="k">{c}</span>
            <span>
              <b>{k.hanViet}</b>
              {compact ? <small>Kanji {k.groupName}</small> : (
                <>
                  <small>{k.meaning}</small>
                  <small>Kanji {k.groupName}</small>
                </>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
