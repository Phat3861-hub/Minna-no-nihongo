/* Tìm từ vựng theo kana/kanji, romaji hoặc nghĩa tiếng Việt. */
import { romaji, toHira } from "./romaji";
import type { VocabWord } from "./types";

const normJp = (s: string) => toHira(s).replace(/[\s～~[\]［］（）()、。,，？?！!・ー]/g, "");

function normRom(s: string): string {
  s = s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
  s = s
    .replace(/shi/g, "si")
    .replace(/chi/g, "ti")
    .replace(/tsu/g, "tu")
    .replace(/fu/g, "hu")
    .replace(/ji/g, "zi")
    .replace(/sh/g, "sy")
    .replace(/ch/g, "ty")
    .replace(/j/g, "zy");
  return s.replace(/ou/g, "o").replace(/([aiueo])\1+/g, "$1");
}

export const normVi = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export type SearchEntry = { w: VocabWord; rom: string; kn: string; kj: string; rn: string; vn: string };

export function buildIndex(words: VocabWord[]): SearchEntry[] {
  return words.map((w) => {
    const r = romaji(w.kana);
    return { w, rom: r, kn: normJp(w.kana), kj: normJp(w.kanji || ""), rn: normRom(r), vn: normVi(w.vi) };
  });
}

function sc(hay: string, q: string) {
  if (!hay || !q) return -1;
  if (hay === q) return 0;
  const p = hay.indexOf(q);
  return p === 0 ? 1 : p > 0 ? 2 : -1;
}
function scVi(hay: string, q: string) {
  if (!hay || !q) return -1;
  if (hay === q) return 0;
  const p = (" " + hay).indexOf(" " + q);
  return p === 0 ? 1 : p > 0 ? 2 : -1;
}

export function searchWords(index: SearchEntry[], raw: string): SearchEntry[] | null {
  const q = String(raw || "").trim();
  if (!q) return null;
  const isJp = /[぀-ヿ㐀-鿿]/.test(q);
  const isVi = !isJp && /[^\x00-\x7fāīūēōĀĪŪĒŌ]/.test(q);
  const qj = normJp(q),
    qr = normRom(q),
    qv = normVi(q);
  const out: { e: SearchEntry; s: number; i: number }[] = [];
  index.forEach((e, i) => {
    let best = -1;
    const take = (s: number) => {
      if (s >= 0 && (best < 0 || s < best)) best = s;
    };
    if (isJp) {
      take(sc(e.kn, qj));
      take(sc(e.kj, qj));
    } else {
      if (!isVi && qr) take(sc(e.rn, qr));
      if (qv.length >= 2) {
        const s = scVi(e.vn, qv);
        if (s >= 0) take(s + 3);
      }
    }
    if (best >= 0) out.push({ e, s: best, i });
  });
  out.sort((a, b) => a.s - b.s || a.i - b.i);
  return out.map((x) => x.e);
}
