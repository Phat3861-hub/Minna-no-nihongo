"use client";
/* Tiến độ “đã thuộc” dùng chung giữa các trang */
import { useMemo } from "react";
import { strArray, useStored } from "./store";

const KEYS = { vocab: "mnn.done", kanji: "mnn.kdone", exercise: "mnn.edone", verb: "mnn.vdone" } as const;

export function useDoneSet(kind: keyof typeof KEYS) {
  const [arr, setArr] = useStored<string[]>(KEYS[kind], [], strArray());
  const set = useMemo(() => new Set(arr), [arr]);
  const toggle = (id: string, v?: boolean) =>
    setArr((prev) => {
      const has = prev.includes(id);
      const want = v ?? !has;
      if (want === has) return prev;
      return want ? [...prev, id] : prev.filter((x) => x !== id);
    });
  const clear = () => setArr([]);
  /** Bỏ đánh dấu một nhóm mục (ví dụ: các bài đang chọn) */
  const removeMany = (ids: string[]) => {
    const rm = new Set(ids);
    setArr((prev) => prev.filter((x) => !rm.has(x)));
  };
  return { done: set, toggle, clear, removeMany };
}
