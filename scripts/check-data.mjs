// Kiểm tra nhanh các file JSON trong thư mục data/ trước khi deploy.
// Chạy: npm run check-data
import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "data");
const errors = [];
const warn = (f, msg) => errors.push(`${f}: ${msg}`);

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, rel), "utf8"));
  } catch (e) {
    warn(rel, `JSON không hợp lệ (${e.message})`);
    return null;
  }
}
const list = (dir) =>
  fs
    .readdirSync(path.join(DATA, dir))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => path.join(dir, f));

let words = 0;
for (const f of list("vocabulary")) {
  const d = readJson(f);
  if (!d) continue;
  if (typeof d.lesson !== "number") warn(f, "thiếu \"lesson\" (số bài)");
  if (!d.title) warn(f, "thiếu \"title\"");
  const seen = new Set();
  (d.words || []).forEach((w, i) => {
    if (!w.kana || !w.vi) warn(f, `từ thứ ${i + 1} thiếu "kana" hoặc "vi"`);
    if (typeof w.kanji !== "string") warn(f, `từ "${w.kana}" thiếu "kanji" (để "" nếu không có)`);
    if (seen.has(w.kana)) warn(f, `từ "${w.kana}" bị trùng trong cùng bài`);
    seen.add(w.kana);
    words++;
  });
}

let ex = 0;
for (const f of list("exercises")) {
  const d = readJson(f);
  if (!d) continue;
  (d.questions || []).forEach((q, i) => {
    if (!Array.isArray(q.options) || q.options.length < 2) warn(f, `câu ${i + 1}: cần ít nhất 2 "options"`);
    else if (!(q.answer >= 0 && q.answer < q.options.length)) warn(f, `câu ${i + 1}: "answer" phải là chỉ số từ 0 đến ${q.options.length - 1}`);
    if (!q.question || !q.explanation) warn(f, `câu ${i + 1}: thiếu "question" hoặc "explanation"`);
    ex++;
  });
}

let points = 0;
for (const f of list("grammar")) {
  const d = readJson(f);
  if (!d) continue;
  (d.points || []).forEach((p, i) => {
    if (!p.pattern || !p.meaning) warn(f, `điểm ${i + 1}: thiếu "pattern" hoặc "meaning"`);
    if (!Array.isArray(p.explanations) || !Array.isArray(p.examples)) warn(f, `điểm ${i + 1}: "explanations" và "examples" phải là mảng`);
    points++;
  });
}

let kanji = 0;
const chars = new Set();
for (const f of list("kanji")) {
  const d = readJson(f);
  if (!d) continue;
  if (!d.id || !d.name) warn(f, "thiếu \"id\" hoặc \"name\"");
  (d.kanji || []).forEach((k) => {
    if (chars.has(k.char)) warn(f, `chữ ${k.char} đã có ở bài khác`);
    chars.add(k.char);
    if (!k.hanViet || !k.meaning) warn(f, `chữ ${k.char}: thiếu "hanViet" hoặc "meaning"`);
    if (!Array.isArray(k.examples)) warn(f, `chữ ${k.char}: "examples" phải là mảng`);
    kanji++;
  });
  (d.sentences || []).forEach((s, i) => {
    if (s.type !== "read" && s.type !== "write") warn(f, `câu ${i + 1}: "type" phải là "read" hoặc "write"`);
    if (!/\{.+?\}/.test(s.sentence || "")) warn(f, `câu ${i + 1}: "sentence" phải có từ gạch chân đặt trong {}`);
    if (!Array.isArray(s.options) || s.options.length !== 4) warn(f, `câu ${i + 1}: cần đúng 4 "options" (đáp án đúng ở vị trí đầu)`);
  });
}

const verbs = readJson("verbs.json");
if (verbs)
  verbs.verbs.forEach((v) => {
    if (![1, 2, 3].includes(v.group)) warn("verbs.json", `${v.masu}: "group" phải là 1, 2 hoặc 3`);
    for (const k of ["dict", "te", "nai", "ta"]) if (!v.forms?.[k]) warn("verbs.json", `${v.masu}: thiếu forms.${k}`);
  });
readJson("speaking.json");
readJson("kanji-config.json");
readJson("romaji-phrases.json");

if (errors.length) {
  console.error("Phát hiện lỗi dữ liệu:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`Dữ liệu hợp lệ: ${words} từ vựng, ${kanji} kanji, ${points} điểm ngữ pháp, ${ex} câu bài tập, ${verbs?.verbs.length ?? 0} động từ.`);
