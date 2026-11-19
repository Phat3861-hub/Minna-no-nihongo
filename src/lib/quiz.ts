/* Trạng thái trắc nghiệm dùng chung cho Từ vựng, Kanji, Bài tập, Nhóm động từ (hàm thuần, bất biến). */

export type Opt = { text: string; ok: boolean };
export type QItem<M = unknown> = { id: string; opts: Opt[]; picked: number | null; meta: M };
export type Quiz<M = unknown> = {
  qs: QItem<M>[];
  i: number;
  view: "q" | "r";
  filter: "wrong" | "all";
  /** vừa chọn đáp án ở câu hiện tại (để tự focus nút “Câu sau”) */
  just: boolean;
};

export const newQuiz = <M>(qs: Omit<QItem<M>, "picked">[]): Quiz<M> => ({
  qs: qs.map((q) => ({ ...q, picked: null })),
  i: 0,
  view: "q",
  filter: "wrong",
  just: false,
});

export const isOk = (q: QItem<unknown>) => q.picked != null && q.opts[q.picked].ok;
export const score = (Q: Quiz<unknown>) => Q.qs.filter(isOk).length;
export const answered = (Q: Quiz<unknown>) => Q.qs.filter((q) => q.picked != null).length;
export const wrongItems = <M>(Q: Quiz<M>) => Q.qs.filter((q) => q.picked != null && !q.opts[q.picked].ok);
export const rightText = (q: QItem<unknown>) => q.opts.find((o) => o.ok)!.text;

export function pick<M>(Q: Quiz<M>, i: number): Quiz<M> | null {
  const q = Q.view === "q" ? Q.qs[Q.i] : null;
  if (!q || q.picked != null || !q.opts[i]) return null;
  const qs = Q.qs.slice();
  qs[Q.i] = { ...q, picked: i };
  return { ...Q, qs, just: true };
}

export function move<M>(Q: Quiz<M>, d: number): Quiz<M> | null {
  if (Q.view === "r") return d < 0 ? { ...Q, view: "q", i: Q.qs.length - 1, just: false } : null;
  if (d < 0) return Q.i === 0 ? null : { ...Q, i: Q.i - 1, just: false };
  if (Q.qs[Q.i].picked == null) return null;
  if (Q.i + 1 >= Q.qs.length) return answered(Q) === Q.qs.length ? { ...Q, view: "r", just: false } : null;
  return { ...Q, i: Q.i + 1, just: false };
}

export const goTo = <M>(Q: Quiz<M>, i: number): Quiz<M> | null =>
  Q.qs[i] ? { ...Q, view: "q", i, just: false } : null;

/** Tạo 4 phương án: đáp án đúng + 3 phương án sai không trùng lặp, lấy từ pool theo thứ tự */
export function buildOptions(correct: string, pool: string[], total = 4): Opt[] {
  const seen = new Set([correct]);
  const opts: Opt[] = [];
  for (const t of pool) {
    if (opts.length >= total - 1) break;
    if (seen.has(t)) continue;
    seen.add(t);
    opts.push({ text: t, ok: false });
  }
  opts.push({ text: correct, ok: true });
  return opts;
}
