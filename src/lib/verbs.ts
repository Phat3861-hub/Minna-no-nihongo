/* Quy tắc chia động từ và tạo câu hỏi luyện tập (hàm thuần) */
import { buildOptions } from "./quiz";
import type { Verb, VerbFormKey } from "./types";
import { shuffled } from "./utils";

export const I_ROW = "いきぎしちにびみり";
const U_ROW = "うくぐすつぬぶむる";
const A_ROW = "わかがさたなばまら";
/** hàng え, dùng để tạo lỗi “chia nhầm nhóm II theo nhóm I” */
const E_ROW = "えけげせてねべめれ";
const TE: Record<string, string> = { い: "って", ち: "って", り: "って", み: "んで", び: "んで", に: "んで", き: "いて", ぎ: "いで", し: "して" };

export const FORM_NAME: Record<VerbFormKey, string> = { te: "Thể て", nai: "Thể ない", dict: "Thể từ điển", ta: "Thể た" };
export const GROUP_LABEL = ["", "Nhóm I", "Nhóm II", "Nhóm III"];

const stemOf = (v: Verb) => v.masu.slice(0, -2);
const toTa = (te: string) => te.replace(/て$/, "た").replace(/で$/, "だ");

/** Giải thích ngắn quy tắc đã dùng để chia */
export function ruleText(v: Verb, f: VerbFormKey): string {
  const st = stemOf(v);
  const last = st.slice(-1);
  if (v.group === 3) {
    if (v.masu === "きます") return "Nhóm III: きます (đến) → くる, きて, こない, きた (học thuộc).";
    return "Nhóm III: します → する, して, しない, した. Danh từ + します chia giống します.";
  }
  if (v.group === 2) {
    const end = { dict: "る", te: "て", nai: "ない", ta: "た" }[f];
    return `Nhóm II: bỏ ます, thêm ${end}.${v.exception ? " " + v.exception + "." : ""}`;
  }
  if (f === "te" || f === "ta") {
    if (v.masu === "いきます") return `Ngoại lệ: いきます → ${f === "te" ? "いって" : "いった"}.`;
    const groups: Record<string, string> = { い: "い, ち, り", ち: "い, ち, り", り: "い, ち, り", み: "み, び, に", び: "み, び, に", に: "み, び, に", き: "き", ぎ: "ぎ", し: "し" };
    const end = f === "te" ? TE[last] : toTa(TE[last]);
    return `Nhóm I: âm trước ます là ${last} (nhóm ${groups[last]}) → ${end}.`;
  }
  if (f === "nai") {
    if (v.masu === "あります") return "Ngoại lệ: あります → ない.";
    const i = I_ROW.indexOf(last);
    return `Nhóm I: đổi ${last} (hàng い) → ${A_ROW[i]}${last === "い" ? " (い đổi thành わ)" : " (hàng あ)"}, thêm ない.`;
  }
  const i = I_ROW.indexOf(last);
  return `Nhóm I: đổi ${last} (hàng い) → ${U_ROW[i]} (hàng う).`;
}

/** Các cách chia sai hay gặp, dùng làm phương án nhiễu */
function wrongForms(v: Verb, f: VerbFormKey): string[] {
  const st = stemOf(v);
  const base = st.slice(0, -1);
  const last = st.slice(-1);
  const i = I_ROW.indexOf(last);
  const e = E_ROW.indexOf(last);
  const out: string[] = [];
  const isTe = f === "te" || f === "ta";
  const sBase = v.group === 3 && v.masu !== "きます" ? st.slice(0, -1) : null; // phần trước し của N + します

  if (sBase != null) {
    if (isTe) out.push(sBase + "しって", sBase + "すて", sBase + "しんで", sBase + "さって");
    else if (f === "nai") out.push(sBase + "さない", sBase + "すない", sBase + "せない");
    else out.push(sBase + "しる", sBase + "す", sBase + "さる");
  } else if (v.masu === "きます") {
    if (isTe) out.push("くって", "こて", "きって", "きいて");
    else if (f === "nai") out.push("きない", "くない", "かない");
    else out.push("きる", "こる", "くう");
  } else if (v.group === 2) {
    // Lỗi hay gặp: chia nhầm theo nhóm I
    if (isTe) {
      out.push(st + "って", st + "んで", st + "いて");
      if (i >= 0 && base) out.push(base + TE[last]);
    } else if (f === "nai") {
      out.push(st + "らない", st + "わない");
      if (i >= 0 && base) out.push(base + A_ROW[i] + "ない");
      if (e >= 0 && base) out.push(base + A_ROW[e] + "ない");
    } else {
      out.push(st + "う", st + "るる");
      if (i >= 0 && base) out.push(base + U_ROW[i]);
      if (e >= 0 && base) out.push(base + U_ROW[e]);
    }
  } else {
    // Nhóm I: nhầm đuôi て, nhầm hàng あ/う, chia theo nhóm II
    if (isTe) {
      ["って", "んで", "いて", "いで", "して"].forEach((x) => out.push(base + x));
      out.push(st + "て");
    } else if (f === "nai") {
      out.push(st + "ない", base + "あない", base + U_ROW[i] + "ない", base + A_ROW[i] + "ない");
      if (v.masu === "あります") out.push("あらない", "ありない");
    } else {
      out.push(st + "る", base + "る", base + "う", base + U_ROW[i]);
    }
  }
  return f === "ta" ? out.map(toTa) : out;
}

export type VQType = "group" | VerbFormKey | "mix" | "tesp";
export type VMeta = { v: Verb; kind: "group" | VerbFormKey };

export function makeVerbQ(v: Verb, kind: "group" | VerbFormKey, all: Verb[]) {
  if (kind === "group") {
    return {
      id: `group:${v.lesson}:${v.masu}:${v.kanji}`,
      meta: { v, kind } as VMeta,
      opts: [1, 2, 3].map((g) => ({ text: GROUP_LABEL[g], ok: g === v.group })),
    };
  }
  const correct = v.forms[kind];
  const pool = shuffled(wrongForms(v, kind)).concat(shuffled(all.filter((x) => x !== v).map((x) => x.forms[kind])));
  return { id: `${kind}:${v.lesson}:${v.masu}:${v.kanji}`, meta: { v, kind } as VMeta, opts: shuffled(buildOptions(correct, pool)) };
}

export function verbQuestions(verbs: Verb[], t: VQType, n: number | "all") {
  const kinds: ("group" | VerbFormKey)[] = ["group", "te", "nai", "dict", "ta"];
  let list = shuffled(verbs).map((v) => ({
    v,
    kind: t === "mix" ? kinds[Math.floor(Math.random() * kinds.length)] : t === "tesp" ? ("te" as const) : t,
  }));
  if (n !== "all") list = list.slice(0, n);
  return list.map((x) => makeVerbQ(x.v, x.kind, verbs));
}
