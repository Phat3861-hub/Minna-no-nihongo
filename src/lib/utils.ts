export function shuffled<T>(a: readonly T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

export const KANJI_RE = /[㐀-鿿々]/;

/** Các chữ kanji (không trùng) xuất hiện trong một chuỗi */
export function kanjiChars(s: string): string[] {
  const seen = new Set<string>();
  return Array.from(s).filter((c) => {
    if (!/[㐀-鿿]/.test(c) || seen.has(c)) return false;
    seen.add(c);
    return true;
  });
}

export const hasKanji = (w: { kanji: string; kana: string }) => !!w.kanji && w.kanji !== w.kana;
export const jpLabel = (w: { kanji: string; kana: string }) => (hasKanji(w) ? `${w.kana}（${w.kanji}）` : w.kana);

/** "Bài 1, 2, 3" hoặc "tất cả Bài 1–13" */
export function lessonLabel(sel: number[], total: number, prefix = "Bài") {
  const s = [...sel].sort((a, b) => a - b);
  if (s.length === total) return `tất cả ${prefix} 1–${total}`;
  return `${prefix} ${s.join(", ")}`;
}
