/*
 * Romaji (Hepburn) tạo tự động từ kana.
 * Hiragana viết nguyên âm dài như trong chữ (ou, uu), katakana dùng ー thì ghi dấu dài (ā, ī, ū, ē, ō).
 * Các cụm từ đặc biệt khai báo trong data/romaji-phrases.json.
 */
import PHRASES from "@data/romaji-phrases.json";

const ROM_PHRASE = PHRASES as Record<string, string>;

const ROM_BASE: Record<string, string> = {};
[
  ["あいうえお", "a i u e o"],
  ["かきくけこ", "ka ki ku ke ko"],
  ["さしすせそ", "sa shi su se so"],
  ["たちつてと", "ta chi tsu te to"],
  ["なにぬねの", "na ni nu ne no"],
  ["はひふへほ", "ha hi fu he ho"],
  ["まみむめも", "ma mi mu me mo"],
  ["やゆよ", "ya yu yo"],
  ["らりるれろ", "ra ri ru re ro"],
  ["わをん", "wa o n"],
  ["がぎぐげご", "ga gi gu ge go"],
  ["ざじずぜぞ", "za ji zu ze zo"],
  ["だぢづでど", "da ji zu de do"],
  ["ばびぶべぼ", "ba bi bu be bo"],
  ["ぱぴぷぺぽ", "pa pi pu pe po"],
  ["ゔ", "vu"],
].forEach(([k, v]) => {
  const vs = v.split(" ");
  for (let i = 0; i < k.length; i++) ROM_BASE[k.charAt(i)] = vs[i];
});

const ROM_SMALL_Y: Record<string, string> = { ゃ: "a", ゅ: "u", ょ: "o" };
const ROM_SMALL_V: Record<string, string> = { ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o" };
const ROM_PAIR: Record<string, string> = { うぃ: "wi", うぇ: "we", てぃ: "ti", でぃ: "di", とぅ: "tu", どぅ: "du" };
const ROM_LONG: Record<string, string> = { a: "ā", i: "ī", u: "ū", e: "ē", o: "ō" };
const ROM_PUNCT: Record<string, string> = { "～": "~", "？": "?", "！": "!", "（": " (", "）": ")", "、": ",", "。": ".", "　": " " };

export function toHira(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

export function romaji(kana: string): string {
  if (ROM_PHRASE[kana]) return ROM_PHRASE[kana];
  const s = toHira(kana);
  let out = "";
  let i = 0;
  let pending = false;
  while (i < s.length) {
    const c = s.charAt(i);
    const nx = s.charAt(i + 1);
    let syl: string | null = null;
    let adv = 1;
    if (c === "っ") {
      pending = true;
      i++;
      continue;
    }
    if (c === "ー") {
      const last = out.charAt(out.length - 1);
      if (ROM_LONG[last]) out = out.slice(0, -1) + ROM_LONG[last];
      i++;
      continue;
    }
    if (c === "ん") {
      const nb = ROM_BASE[nx] || "";
      syl = nb && /^[aiueoy]/.test(nb) ? "n'" : "n";
    } else if (ROM_BASE[c]) {
      const base = ROM_BASE[c];
      if (ROM_SMALL_Y[nx]) {
        syl = base === "shi" || base === "chi" || base === "ji" ? base.slice(0, -1) + ROM_SMALL_Y[nx] : base.slice(0, -1) + "y" + ROM_SMALL_Y[nx];
        adv = 2;
      } else if (ROM_SMALL_V[nx]) {
        const pair = c + nx;
        syl = ROM_PAIR[pair] ? ROM_PAIR[pair] : base.slice(0, -1) + ROM_SMALL_V[nx];
        adv = 2;
      } else syl = base;
    } else if (ROM_PUNCT[c] !== undefined) {
      out += ROM_PUNCT[c];
      pending = false;
      i++;
      continue;
    } else {
      out += c;
      pending = false;
      i++;
      continue;
    }
    if (pending) {
      if (/^ch/.test(syl)) syl = "t" + syl;
      else if (/^[bcdfghjklmnpqrstvwxyz]/.test(syl)) syl = syl.charAt(0) + syl;
      pending = false;
    }
    out += syl;
    i += adv;
  }
  return out.replace(/\s+/g, " ").trim();
}

/* ---------- furigana: {chữ|cách đọc} ---------- */
export const RUBY_RE = /\{([^{}|]+)\|([^{}|]+)\}/g;
export const rubyKana = (s: string) => s.replace(RUBY_RE, "$2");
export const rubyPlain = (s: string) => s.replace(RUBY_RE, "$1");

/** Romaji cho cả câu: tách theo khoảng trắng; trợ từ は／へ／を ở cuối cụm đọc là wa／e／o */
export function sentenceRomaji(s: string): string {
  const k = rubyKana(s).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  return k
    .split(/(\s+|[。、・／？！])/)
    .map((t) => {
      if (!t || /^\s+$/.test(t)) return " ";
      if (/^[。、・／？！]$/.test(t)) return romaji(t);
      const m = t.match(/^(.+?)(は|へ|を)$/);
      if (m) return romaji(m[1]) + " " + ({ は: "wa", へ: "e", を: "o" } as Record<string, string>)[m[2]];
      return romaji(t);
    })
    .join("")
    .replace(/\s+([.,?!])/g, "$1")
    .replace(/([.?!])(?=\S)/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}
