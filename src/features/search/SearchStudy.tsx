"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconSearch } from "@/components/icons";
import { Empty } from "@/components/ui";
import WordRow from "@/components/vocab/WordRow";
import { useDoneSet } from "@/lib/progress";
import { buildIndex, searchWords } from "@/lib/search";
import type { KanjiBrief, VocabWord } from "@/lib/types";

const LIMIT = 80;
const EXAMPLES = ["せんせい", "先生", "sensei", "kohi", "benkyou", "ngân hàng"];

export default function SearchStudy({
  words,
  lessonCount,
  kanjiIndex,
  verbGroups,
}: {
  words: VocabWord[];
  lessonCount: number;
  kanjiIndex: Record<string, KanjiBrief>;
  verbGroups: Record<string, number>;
}) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const index = useMemo(() => buildIndex(words), [words]);
  const res = useMemo(() => searchWords(index, q), [index, q]);
  const { done, toggle } = useDoneSet("vocab");

  useEffect(() => {
    const p = params.get("q");
    if (p != null) setQ(p);
  }, [params]);
  useEffect(() => {
    const url = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : location.pathname;
    window.history.replaceState(null, "", url);
  }, [q]);
  useEffect(() => inputRef.current?.focus({ preventScroll: true }), []);

  return (
    <>
      <div className="search-box">
        <IconSearch />
        <input
          ref={inputRef}
          className="input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ví dụ: せんせい, 先生, sensei"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Từ cần tìm"
        />
      </div>
      <p className="cap" aria-live="polite" style={{ marginTop: 10 }}>
        {res === null
          ? `Có ${words.length} từ trong Bài 1–${lessonCount}. Ô đã đánh dấu là từ bạn đã thuộc.`
          : !res.length
            ? `Không tìm thấy từ nào khớp “${q.trim()}”.`
            : `Tìm thấy ${res.length} từ${res.length > LIMIT ? `, hiện ${LIMIT} từ khớp nhất` : ""}.`}
      </p>
      {res === null ? (
        <div className="ex-list">
          <span className="cap" style={{ margin: 0 }}>
            Thử tìm:
          </span>
          {EXAMPLES.map((x) => (
            <button key={x} type="button" className="exb" onClick={() => setQ(x)}>
              {x}
            </button>
          ))}
        </div>
      ) : !res.length ? (
        <Empty title="Không có kết quả">Thử gõ ngắn hơn, hoặc gõ phiên âm không dấu, ví dụ “kohi” cho コーヒー.</Empty>
      ) : (
        <ul className="words">
          {res.slice(0, LIMIT).map((e) => (
            <WordRow
              key={e.w.id}
              w={e.w}
              done={done.has(e.w.id)}
              onTick={() => toggle(e.w.id)}
              kanjiIndex={kanjiIndex}
              verbGroups={verbGroups}
              showLesson
            />
          ))}
        </ul>
      )}
    </>
  );
}
