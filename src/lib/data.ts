/*
 * Đọc dữ liệu từ thư mục /data lúc build (chỉ chạy phía server).
 * Muốn thêm bài mới: tạo file JSON mới trong thư mục tương ứng (ví dụ data/vocabulary/bai-14.json),
 * không cần sửa code. Tên file được sắp xếp theo thứ tự chữ cái, nên hãy đặt tên dạng bai-01, bai-02…
 */
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import type {
  ExerciseQuestion,
  GrammarLesson,
  KanjiBrief,
  KanjiData,
  KanjiGroup,
  KanjiSentence,
  SpeakingData,
  VerbData,
  VocabLesson,
  VocabWord,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, rel), "utf8")) as T;
}

function readDir<T>(dir: string): T[] {
  return fs
    .readdirSync(path.join(DATA_DIR, dir))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => readJson<T>(path.join(dir, f)));
}

type RawVocab = { lesson: number; title: string; words: Omit<VocabWord, "id" | "lesson">[] };

export const getVocabLessons = cache((): VocabLesson[] =>
  readDir<RawVocab>("vocabulary")
    .sort((a, b) => a.lesson - b.lesson)
    .map((L) => ({
      lesson: L.lesson,
      title: L.title,
      words: L.words.map((w) => ({
        id: `${L.lesson}:${w.kana}`,
        lesson: L.lesson,
        kana: w.kana,
        kanji: w.kanji ?? "",
        vi: w.vi,
        ...(w.note ? { note: w.note } : {}),
      })),
    })),
);

type RawKanji = {
  id: string;
  name: string;
  kanji: {
    char: string;
    hanViet: string;
    meaning: string;
    on: string;
    kun: string;
    examples: { word: string; reading: string; meaning: string }[];
  }[];
  sentences?: Omit<KanjiSentence, "id" | "group">[];
};

export const getKanjiData = cache((): KanjiData => {
  const raws = readDir<RawKanji>("kanji").sort(
    (a, b) => Number(a.id.replace(/\D/g, "")) - Number(b.id.replace(/\D/g, "")),
  );
  let n = 0;
  const groups: KanjiGroup[] = [];
  const sentences: KanjiSentence[] = [];
  for (const g of raws) {
    groups.push({
      id: g.id,
      name: g.name,
      items: g.kanji.map((k) => ({
        id: k.char,
        n: ++n,
        group: g.id,
        groupName: g.name,
        ...k,
      })),
    });
    (g.sentences ?? []).forEach((s, i) => sentences.push({ id: `s:${g.id}:${i}`, group: g.id, ...s }));
  }
  const cfg = readJson<{ similar: Record<string, string>; alternativeReadings: Record<string, string[]> }>(
    "kanji-config.json",
  );
  return { groups, sentences, similar: cfg.similar, alternativeReadings: cfg.alternativeReadings };
});

/** Bảng tra nhanh chữ kanji → thông tin rút gọn (dùng cho phần Từ vựng) */
export const getKanjiIndex = cache((): Record<string, KanjiBrief> => {
  const out: Record<string, KanjiBrief> = {};
  for (const g of getKanjiData().groups)
    for (const k of g.items)
      out[k.char] = {
        char: k.char,
        hanViet: k.hanViet,
        meaning: k.meaning,
        on: k.on,
        kun: k.kun,
        group: k.group,
        groupName: k.groupName,
      };
  return out;
});

export const getGrammarLessons = cache((): GrammarLesson[] =>
  readDir<GrammarLesson>("grammar").sort((a, b) => a.lesson - b.lesson),
);

type RawExercises = { lesson: number; questions: Omit<ExerciseQuestion, "id" | "lesson">[] };

export const getExercises = cache((): ExerciseQuestion[] =>
  readDir<RawExercises>("exercises")
    .sort((a, b) => a.lesson - b.lesson)
    .flatMap((L) => L.questions.map((q, i) => ({ id: `${L.lesson}:${i}`, lesson: L.lesson, ...q }))),
);

type RawSpeaking = {
  sections: {
    id: string;
    title: string;
    jp: string;
    items: { question: string; meaning: string; grammar: string; answers: { jp: string; vi: string }[]; tip?: string }[];
  }[];
  help: { jp: string; vi: string }[];
};

export const getSpeaking = cache((): SpeakingData => {
  const raw = readJson<RawSpeaking>("speaking.json");
  return {
    help: raw.help,
    sections: raw.sections.map((s) => ({
      id: s.id,
      title: s.title,
      jp: s.jp,
      items: s.items.map((it, i) => ({ id: `${s.id}:${i}`, section: s.id, n: i + 1, ...it })),
    })),
  };
});

export const getVerbData = cache((): VerbData => readJson<VerbData>("verbs.json"));
