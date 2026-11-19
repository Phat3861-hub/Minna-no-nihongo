/* Cách đọc số, giờ, ngày tháng (hàm thuần, không phụ thuộc giao diện). */

export const D1 = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];

export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function chunk4(n: number): string {
  const th = Math.floor(n / 1000),
    h = Math.floor(n / 100) % 10,
    t = Math.floor(n / 10) % 10,
    o = n % 10;
  let s = "";
  if (th) s += th === 1 ? "せん" : th === 3 ? "さんぜん" : th === 8 ? "はっせん" : D1[th] + "せん";
  if (h) s += h === 1 ? "ひゃく" : h === 3 ? "さんびゃく" : h === 6 ? "ろっぴゃく" : h === 8 ? "はっぴゃく" : D1[h] + "ひゃく";
  if (t) s += t === 1 ? "じゅう" : D1[t] + "じゅう";
  if (o) s += D1[o];
  return s;
}

export function numKana(n: number): string {
  if (n === 0) return "ゼロ";
  const man = Math.floor(n / 10000),
    rest = n % 10000;
  let s = "";
  if (man) s += (man === 1000 ? "いっせん" : chunk4(man)) + "まん";
  if (rest) s += chunk4(rest);
  return s;
}

export const HR = ["れい", "いち", "に", "さん", "よ", "ご", "ろく", "しち", "はち", "く", "じゅう", "じゅういち", "じゅうに"];
const MINO = ["", "いっぷん", "にふん", "さんぷん", "よんぷん", "ごふん", "ろっぷん", "ななふん", "はっぷん", "きゅうふん"];

export function minKana(m: number): string {
  const t = Math.floor(m / 10),
    o = m % 10;
  if (o === 0) return t === 1 ? "じゅっぷん" : D1[t] + "じゅっぷん";
  return (t === 0 ? "" : t === 1 ? "じゅう" : D1[t] + "じゅう") + MINO[o];
}

export function timeRead(h: number, m: number) {
  const h12 = h === 0 ? 0 : h <= 12 ? h : h - 12;
  const apK = h < 12 ? "午前" : "午後",
    apH = h < 12 ? "ごぜん" : "ごご";
  let kanji = apK + h12 + "時",
    kana = apH + " " + HR[h12] + "じ",
    alt = "";
  if (m === 30) {
    kanji += "半";
    kana += " はん";
    alt = apH + " " + HR[h12] + "じ " + minKana(30);
  } else if (m > 0) {
    kanji += m + "分";
    kana += " " + minKana(m);
  }
  return { kanji, kana, alt };
}

const MON = ["", "いち", "に", "さん", "し", "ご", "ろく", "しち", "はち", "く", "じゅう", "じゅういち", "じゅうに"];
export const monthKana = (m: number) => MON[m] + "がつ";

export const SPECIAL_DAYS: Record<number, string> = {
  1: "ついたち", 2: "ふつか", 3: "みっか", 4: "よっか", 5: "いつか", 6: "むいか", 7: "なのか",
  8: "ようか", 9: "ここのか", 10: "とおか", 14: "じゅうよっか", 20: "はつか", 24: "にじゅうよっか",
};
const DONES = ["", "いち", "に", "さん", "", "ご", "ろく", "しち", "はち", "く"];

export function dayKana(d: number): string {
  if (SPECIAL_DAYS[d]) return SPECIAL_DAYS[d];
  const t = Math.floor(d / 10),
    o = d % 10;
  return (t === 0 ? "" : t === 1 ? "じゅう" : D1[t] + "じゅう") + DONES[o] + "にち";
}

const YONES = ["", "いち", "に", "さん", "よ", "ご", "ろく", "なな", "はち", "く"];
export function yearKana(y: number): string {
  const o = y % 10,
    base = y - o;
  if (o === 0) return numKana(y) + "ねん";
  return (base ? numKana(base) : "") + YONES[o] + "ねん";
}

export const WK_K = ["日", "月", "火", "水", "木", "金", "土"];
const WK_H = ["にち", "げつ", "か", "すい", "もく", "きん", "ど"];
export const weekKana = (w: number) => WK_H[w] + "ようび";

export function dateRead(y: number, mo: number, d: number) {
  const w = new Date(y, mo - 1, d).getDay();
  return {
    kanji: y + "年" + mo + "月" + d + "日（" + WK_K[w] + "）",
    kana: yearKana(y) + " " + monthKana(mo) + " " + dayKana(d) + " " + weekKana(w),
    w,
  };
}

const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

export type NumTab = "number" | "time" | "date";

/** Tạo một câu luyện đọc ngẫu nhiên */
export function genPractice(t: NumTab): { src: string; kana: string } {
  const r = Math.random();
  if (t === "number") {
    let n: number;
    if (r < 0.2) n = ri(11, 99);
    else if (r < 0.5) n = ri(1, 9) * 100 + (Math.random() < 0.5 ? 0 : ri(0, 9) * 10);
    else if (r < 0.75) n = ri(1, 9) * 1000 + (Math.random() < 0.5 ? 0 : ri(0, 9) * 100);
    else n = ri(1, 99) * 10000 + (Math.random() < 0.5 ? 0 : ri(0, 9) * 1000);
    return { src: fmt(n), kana: numKana(n) };
  }
  if (t === "time") {
    const h = ri(1, 23),
      pool = [0, 0, 5, 10, 15, 30, 30, 45],
      m = Math.random() < 0.6 ? pool[ri(0, pool.length - 1)] : ri(1, 59);
    const tr = timeRead(h, m);
    return { src: tr.kanji, kana: tr.kana };
  }
  const dim = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    mo = ri(1, 12);
  const sp = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 20, 24];
  const d = Math.random() < 0.5 ? sp[ri(0, sp.length - 1)] : ri(1, dim[mo - 1]);
  return { src: mo + "月" + d + "日", kana: monthKana(mo) + " " + dayKana(d) };
}
