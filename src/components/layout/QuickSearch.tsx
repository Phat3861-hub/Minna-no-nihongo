"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDoneSet } from "@/lib/progress";
import { buildIndex, searchWords } from "@/lib/search";
import type { KanjiBrief, VocabWord } from "@/lib/types";
import { IconClose, IconSearch } from "../icons";
import WordRow from "../vocab/WordRow";

const LIMIT = 30;

/** Hộp tìm nhanh (Ctrl/⌘ + K), mở được ở mọi trang */
export default function QuickSearch({
  words,
  kanjiIndex,
  onClose,
}: {
  words: VocabWord[];
  kanjiIndex: Record<string, KanjiBrief>;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const index = useMemo(() => buildIndex(words), [words]);
  const res = useMemo(() => searchWords(index, q), [index, q]);
  const { done, toggle } = useDoneSet("vocab");

  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="qs-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qs-panel" role="dialog" aria-modal="true" aria-label="Tìm từ vựng">
        <div className="qs-input">
          <IconSearch />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Gõ kana, kanji, romaji hoặc tiếng Việt…"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Từ cần tìm"
          />
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
            <IconClose />
          </button>
        </div>
        <div className="qs-body">
          {res === null ? (
            <div className="empty" style={{ border: 0 }}>
              <p className="big">Tra nhanh {words.length} từ vựng</p>
              <p>Ví dụ: せんせい, 先生, sensei, kohi, ngân hàng</p>
            </div>
          ) : !res.length ? (
            <div className="empty" style={{ border: 0 }}>
              <p className="big">Không có kết quả</p>
              <p>Thử gõ ngắn hơn hoặc gõ phiên âm không dấu.</p>
            </div>
          ) : (
            <ul className="words" style={{ border: 0 }}>
              {res.slice(0, LIMIT).map((e) => (
                <WordRow
                  key={e.w.id}
                  w={e.w}
                  done={done.has(e.w.id)}
                  onTick={() => toggle(e.w.id)}
                  kanjiIndex={kanjiIndex}
                  showLesson
                />
              ))}
            </ul>
          )}
        </div>
        <div className="qs-foot">
          <span>{res ? `Tìm thấy ${res.length} từ` : "Esc để đóng"}</span>
          {q.trim() && (
            <Link href={`/tim-tu?q=${encodeURIComponent(q.trim())}`} onClick={onClose}>
              Mở trang Tìm từ →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
