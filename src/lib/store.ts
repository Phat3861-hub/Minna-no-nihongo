"use client";
/*
 * Lưu trạng thái trên trình duyệt (localStorage) và đồng bộ giữa các component.
 * Các khóa giữ nguyên như bản cũ (mnn.*) để không mất tiến độ đã lưu.
 */
import { useCallback, useSyncExternalStore } from "react";

const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function read<T>(key: string, def: T, validate?: (v: unknown) => T | undefined): T {
  if (cache.has(key)) return cache.get(key) as T;
  let v: T = def;
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (raw != null) {
      const parsed = JSON.parse(raw);
      const ok = validate ? validate(parsed) : (parsed as T);
      if (ok !== undefined) v = ok;
    }
  } catch {
    /* bỏ qua */
  }
  cache.set(key, v);
  return v;
}

export function writeStored<T>(key: string, v: T) {
  cache.set(key, v);
  try {
    window.localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* bỏ qua */
  }
  listeners.get(key)?.forEach((l) => l());
}

function subscribe(key: string, cb: () => void) {
  let s = listeners.get(key);
  if (!s) listeners.set(key, (s = new Set()));
  s.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === key) {
      cache.delete(key);
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    s!.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Giống useState nhưng lưu vào localStorage. Phía server luôn trả về giá trị mặc định.
 * validate: trả về giá trị hợp lệ hoặc undefined để dùng mặc định.
 */
export function useStored<T>(
  key: string,
  def: T,
  validate?: (v: unknown) => T | undefined,
): [T, (v: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    useCallback((cb) => subscribe(key, cb), [key]),
    () => read(key, def, validate),
    () => def,
  );
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      const prev = read(key, def, validate);
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      writeStored(key, next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set];
}

/* Bộ kiểm tra giá trị hay dùng */
export const oneOf =
  <T extends string>(...vals: T[]) =>
  (v: unknown): T | undefined =>
    vals.includes(v as T) ? (v as T) : undefined;

export const isBool = (v: unknown) => (typeof v === "boolean" ? v : undefined);

export const numArray =
  (valid: (n: number) => boolean) =>
  (v: unknown): number[] | undefined =>
    Array.isArray(v) ? v.filter((n) => typeof n === "number" && valid(n)) : undefined;

export const strArray =
  (valid?: (s: string) => boolean) =>
  (v: unknown): string[] | undefined =>
    Array.isArray(v) ? v.filter((s) => typeof s === "string" && (!valid || valid(s))) : undefined;

/** Bật/tắt một phần tử trong mảng */
export function toggleIn<T>(arr: T[], x: T): T[] {
  return arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x];
}
