/* Kiểu dữ liệu dùng chung. Dữ liệu gốc nằm trong thư mục /data (file JSON). */

export type VocabWord = {
  /** "bài:kana", ví dụ "1:わたし" (dùng để lưu tiến độ) */
  id: string;
  lesson: number;
  kana: string;
  kanji: string;
  vi: string;
  note?: string;
};

export type VocabLesson = { lesson: number; title: string; words: VocabWord[] };

export type KanjiExample = { word: string; reading: string; meaning: string };

export type KanjiItem = {
  /** chính là chữ kanji */
  id: string;
  /** thứ tự trong toàn bộ bảng */
  n: number;
  group: string;
  groupName: string;
  char: string;
  hanViet: string;
  meaning: string;
  on: string;
  kun: string;
  examples: KanjiExample[];
};

export type KanjiSentence = {
  id: string;
  group: string;
  type: "read" | "write";
  sentence: string;
  meaning: string;
  options: string[];
  wordMeaning: string;
  tip?: string;
};

export type KanjiGroup = { id: string; name: string; items: KanjiItem[] };

export type KanjiData = {
  groups: KanjiGroup[];
  sentences: KanjiSentence[];
  similar: Record<string, string>;
  alternativeReadings: Record<string, string[]>;
};

/** Thông tin rút gọn của một chữ kanji để hiển thị trong phần từ vựng */
export type KanjiBrief = {
  char: string;
  hanViet: string;
  meaning: string;
  on: string;
  kun: string;
  group: string;
  groupName: string;
};

export type GrammarPoint = {
  pattern: string;
  meaning: string;
  explanations: string[];
  examples: { jp: string; vi: string }[];
  note?: string;
};

export type GrammarLesson = { lesson: number; title: string; points: GrammarPoint[] };

export type ExerciseQuestion = {
  id: string;
  lesson: number;
  question: string;
  instruction?: string;
  hint?: string;
  meaning?: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type SpeakingItem = {
  id: string;
  section: string;
  n: number;
  question: string;
  meaning: string;
  grammar: string;
  answers: { jp: string; vi: string }[];
  tip?: string;
};

export type SpeakingSection = { id: string; title: string; jp: string; items: SpeakingItem[] };

export type SpeakingData = { sections: SpeakingSection[]; help: { jp: string; vi: string }[] };

export type VerbFormKey = "dict" | "te" | "nai" | "ta";

export type Verb = {
  lesson: number;
  masu: string;
  kanji: string;
  vi: string;
  group: 1 | 2 | 3;
  exception?: string;
  forms: Record<VerbFormKey, string>;
};

export type VerbData = {
  groups: { group: number; name: string; alias: string; rule: string; examples: string[] }[];
  exceptionsGroup2: { note: string; inLessons: string[]; later: string[] };
  forms: {
    key: VerbFormKey;
    name: string;
    lesson: number;
    use: string;
    rules: { group: number; items: string[] }[];
  }[];
  tips: string[];
  /** Thể て: các động từ N5 đặc biệt hoặc dễ nhầm */
  teSpecial?: { note: string; groups: { title: string; desc: string; items: Omit<Verb, "lesson">[] }[] };
  verbs: Verb[];
};
