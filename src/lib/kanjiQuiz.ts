/* Tạo câu hỏi trắc nghiệm kanji: nghĩa, cách đọc, cách viết, câu gạch chân (hàm thuần) */
import type { Opt } from "./quiz";
import { toHira } from "./romaji";
import type { KanjiData, KanjiItem, KanjiSentence } from "./types";
import { shuffled } from "./utils";

export type KQType = "mean" | "read" | "write" | "sread" | "swrite" | "mix";
export type KSrc = { k: "mean" | "read" | "write" | "sent"; id: string };
export type KWord = { w: string; r: string; m: string; ks: string[] };

export type KanjiCtx = {
  data: KanjiData;
  byId: Map<string, KanjiItem>;
  all: KanjiItem[];
  words: Map<string, KWord>;
  wordList: KWord[];
  sentById: Map<string, KanjiSentence>;
  dak: Record<string, string[]>;
};

export function buildKanjiCtx(data: KanjiData): KanjiCtx {
  const all = data.groups.flatMap((g) => g.items);
  const byId = new Map(all.map((o) => [o.id, o]));
  const words = new Map<string, KWord>();
  const wordList: KWord[] = [];
  for (const o of all)
    for (const x of o.examples) {
      if (!/[㐀-鿿]/.test(x.word)) continue;
      let e = words.get(x.word);
      if (!e) {
        e = { w: x.word, r: x.reading, m: x.meaning, ks: [] };
        words.set(x.word, e);
        wordList.push(e);
      }
      if (!e.ks.includes(o.id)) e.ks.push(o.id);
    }
  const dak: Record<string, string[]> = {};
  ["かが", "きぎ", "くぐ", "けげ", "こご", "さざ", "しじ", "すず", "せぜ", "そぞ", "ただ", "てで", "とど", "はばぱ", "ひびぴ", "ふぶぷ", "へべぺ", "ほぼぽ"].forEach((g) => {
    const a = Array.from(g);
    a.forEach((c) => (dak[c] = a.filter((x) => x !== c)));
  });
  return { data, byId, all, words, wordList, sentById: new Map(data.sentences.map((s) => [s.id, s])), dak };
}

const K_OROW = "おこそとのほもよろごぞどぼぽょ",
  K_UROW = "うくすつぬふむゆるぐずぶぷゅ",
  K_EROW = "えけせてねへめれげぜでべぺ",
  K_ST = "かきくけこさしすせそたちつてとぱぴぷぺぽ";

/** Tạo cách đọc sai “dễ nhầm”: thêm/bớt dấu ゛゜, っ, trường âm */
function perturb(ctx: KanjiCtx, r: string, lo = 0, hi?: number): string[] {
  const c = Array.from(r);
  const out: string[] = [];
  const seen = new Set([r]);
  const add = (a: string[]) => {
    const s = a.join("");
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };
  const rep = (i: number, v: string) => {
    const a = c.slice();
    a[i] = v;
    return a;
  };
  const del = (i: number) => {
    const a = c.slice();
    a.splice(i, 1);
    return a;
  };
  const ins = (i: number, v: string) => {
    const a = c.slice();
    a.splice(i, 0, v);
    return a;
  };
  for (let i = lo; i < (hi ?? c.length); i++) {
    const ch = c[i],
      nx = c[i + 1];
    (ctx.dak[ch] || []).forEach((v) => add(rep(i, v)));
    if (nx === "う" && K_UROW.includes(ch)) add(del(i + 1));
    if (nx === "う" && K_OROW.includes(ch)) {
      add(del(i + 1));
      add(rep(i + 1, "お"));
    }
    if (nx === "お" && K_OROW.includes(ch)) add(rep(i + 1, "う"));
    if (nx === "い" && K_EROW.includes(ch)) add(del(i + 1));
    if ((K_OROW + "ゅ").includes(ch) && nx && nx !== "う" && nx !== "お") add(ins(i + 1, "う"));
    if (ch === "っ") {
      add(del(i));
      if (nx && "かきくけこ".includes(nx)) add(rep(i, "く"));
    }
    if (i > 0 && "くきちつ".includes(ch) && nx && K_ST.includes(nx)) add(rep(i, "っ"));
    if (nx && K_ST.includes(nx) && !"んっゃゅょぁぃぅぇぉー".includes(ch) && ch !== nx) add(ins(i + 1, "っ"));
  }
  return out;
}

function fill(opts: Opt[], seen: Set<string>, pool: KWord[], key: "r" | "w", len: number) {
  [0, 1, 2, 99].forEach((d) => {
    for (let i = 0; i < pool.length && opts.length < 4; i++) {
      const t = pool[i][key];
      if (seen.has(t) || Math.abs(Array.from(t).length - len) > d) continue;
      seen.add(t);
      opts.push({ text: t, ok: false });
    }
  });
}

/** Tách phần kana giống nhau ở đầu/cuối (お～, okurigana) */
function split(e: KWord) {
  const w = Array.from(e.w),
    r = Array.from(e.r);
  let pre = 0,
    suf = 0;
  while (pre < w.length && pre < r.length && w[pre] === r[pre]) pre++;
  while (suf < w.length - pre && suf < r.length - pre && w[w.length - 1 - suf] === r[r.length - 1 - suf]) suf++;
  return { w, r, pre, suf, mid: w.slice(pre, w.length - suf).join("") };
}

function otherReads(ctx: KanjiCtx, sp: ReturnType<typeof split>): string[] {
  const o = ctx.byId.get(sp.mid);
  if (!o) return [];
  const head = sp.r.slice(0, sp.pre).join(""),
    tail = sp.r.slice(sp.r.length - sp.suf).join("");
  const out: string[] = [];
  (o.on + "、" + o.kun).split("、").forEach((x) => {
    x = toHira(x.split("・")[0].trim());
    if (x && x !== "—") out.push(head + x + tail);
  });
  return out;
}

function wordPool(ctx: KanjiCtx, e: KWord, sel: Set<string>) {
  const near = shuffled(ctx.wordList.filter((x) => x !== e && x.ks.some((k) => sel.has(ctx.byId.get(k)!.group))));
  return near.concat(shuffled(ctx.wordList.filter((x) => x !== e)));
}

function readOpts(ctx: KanjiCtx, e: KWord, sel: Set<string>): Opt[] {
  const seen = new Set([e.r]);
  const opts: Opt[] = [{ text: e.r, ok: true }];
  (ctx.data.alternativeReadings[e.w] || []).forEach((x) => seen.add(x));
  const sp = split(e);
  const other = shuffled(otherReads(ctx, sp)).slice(0, 2);
  other.concat(shuffled(perturb(ctx, e.r, sp.pre, sp.r.length - sp.suf))).forEach((t) => {
    if (opts.length < 4 && !seen.has(t)) {
      seen.add(t);
      opts.push({ text: t, ok: false });
    }
  });
  fill(opts, seen, wordPool(ctx, e, sel), "r", Array.from(e.r).length);
  return shuffled(opts);
}

function writeOpts(ctx: KanjiCtx, e: KWord, sel: Set<string>): Opt[] {
  const seen = new Set([e.w]);
  const opts: Opt[] = [{ text: e.w, ok: true }];
  const c = Array.from(e.w);
  const cand: string[] = [];
  c.forEach((ch, i) =>
    Array.from(ctx.data.similar[ch] || "").forEach((v) => {
      const a = c.slice();
      a[i] = v;
      cand.push(a.join(""));
    }),
  );
  shuffled(cand).forEach((t) => {
    if (opts.length < 4 && !seen.has(t)) {
      seen.add(t);
      opts.push({ text: t, ok: false });
    }
  });
  fill(opts, seen, wordPool(ctx, e, sel), "w", c.length);
  return shuffled(opts);
}

export const meanLabel = (x: KanjiItem) => `${x.hanViet} · ${x.meaning}`;

function meanOpts(ctx: KanjiCtx, o: KanjiItem, sel: Set<string>): Opt[] {
  const near = shuffled(ctx.all.filter((x) => x.id !== o.id && sel.has(x.group)));
  const far = shuffled(ctx.all.filter((x) => x.id !== o.id && !sel.has(x.group)));
  const seen = new Set([meanLabel(o)]);
  const opts: Opt[] = [];
  for (const x of near.concat(far)) {
    if (opts.length >= 3) break;
    const l = meanLabel(x);
    if (seen.has(l)) continue;
    seen.add(l);
    opts.push({ text: l, ok: false });
  }
  opts.push({ text: meanLabel(o), ok: true });
  return shuffled(opts);
}

export function makeKQ(ctx: KanjiCtx, src: KSrc, sel: Set<string>) {
  let opts: Opt[];
  if (src.k === "mean") opts = meanOpts(ctx, ctx.byId.get(src.id)!, sel);
  else if (src.k === "read") opts = readOpts(ctx, ctx.words.get(src.id)!, sel);
  else if (src.k === "write") opts = writeOpts(ctx, ctx.words.get(src.id)!, sel);
  else opts = shuffled(ctx.sentById.get(src.id)!.options.map((t, i) => ({ text: t, ok: i === 0 })));
  return { id: `${src.k}:${src.id}`, meta: src, opts };
}

export function kanjiSources(ctx: KanjiCtx, t: KQType, sel: Set<string>, onlyNew: boolean, done: Set<string>): KSrc[] {
  const deck = ctx.all.filter((o) => sel.has(o.group) && (!onlyNew || !done.has(o.id)));
  const wordDeck = () => ctx.wordList.filter((e) => e.ks.some((k) => sel.has(ctx.byId.get(k)!.group) && (!onlyNew || !done.has(k))));
  const sentDeck = (tp?: "read" | "write") => ctx.data.sentences.filter((s) => sel.has(s.group) && (!tp || s.type === tp));
  if (t === "mean") return deck.map((o) => ({ k: "mean", id: o.id }));
  if (t === "read" || t === "write") return wordDeck().map((e) => ({ k: t, id: e.w }));
  if (t === "sread") return sentDeck("read").map((s) => ({ k: "sent", id: s.id }));
  if (t === "swrite") return sentDeck("write").map((s) => ({ k: "sent", id: s.id }));
  const ws: KSrc[] = wordDeck().map((e) => ({ k: Math.random() < 0.5 ? "read" : "write", id: e.w }));
  return ws.concat(sentDeck().map((s) => ({ k: "sent", id: s.id })));
}

/** Câu gạch chân: tách phần trước, từ gạch chân, phần sau */
export function splitSentence(s: string): [string, string, string] | null {
  const m = s.match(/^(.*)\{(.+?)\}(.*)$/);
  return m ? [m[1], m[2], m[3]] : null;
}
export const sentTarget = (s: KanjiSentence) => splitSentence(s.sentence)?.[1] ?? "";
