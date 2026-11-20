"use client";
/* Các thành phần giao diện nhỏ dùng chung */
import { useEffect, useState, type ReactNode } from "react";
import { IconChevron } from "./icons";

export function PageHead({ eyebrow, jp, title, children }: { eyebrow?: string; jp?: string; title: string; children?: ReactNode }) {
  return (
    <div className="page-head">
      {(eyebrow || jp) && (
        <span className="eyebrow">
          {jp && <span className="jp">{jp}</span>}
          {eyebrow}
        </span>
      )}
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T;
  options: [T, ReactNode][];
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={"seg" + (className ? " " + className : "")} role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="switch">
      <span>{children}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export type ChipItem = { key: string; title: ReactNode; sub?: ReactNode; progress?: number; tooltip?: string };

/** Lưới chọn bài (chọn nhiều hoặc một) */
export function ChipPicker({
  items,
  selected,
  onToggle,
  wide,
  label,
}: {
  items: ChipItem[];
  selected: (key: string) => boolean;
  onToggle: (key: string) => void;
  wide?: boolean;
  label: string;
}) {
  return (
    <div className={"chips scroll-sm" + (wide ? " wide" : "")} role="group" aria-label={label}>
      {items.map((c) => (
        <button key={c.key} type="button" className="chip" aria-pressed={selected(c.key)} onClick={() => onToggle(c.key)} title={c.tooltip}>
          <span className="n">{c.title}</span>
          {c.sub != null && <span className="c">{c.sub}</span>}
          {c.progress != null && (
            <span className="bar">
              <i style={{ width: `${Math.round(c.progress * 100)}%` }} />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Khối tùy chọn: trên điện thoại có thể thu gọn */
export function OptionsPanel({ title = "Tùy chọn", children, defaultOpen = false }: { title?: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="panel">
      <button type="button" className="opts-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {title}
        <IconChevron />
      </button>
      <div className={"opts-body" + (open ? "" : " collapsed")}>{children}</div>
    </section>
  );
}

export function Meter({ label, value }: { label: ReactNode; value: number }) {
  return (
    <div className="meter">
      <span>{label}</span>
      <span className="bar">
        <i style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
      </span>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="big">{title}</p>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Chỉ hiển thị phần con sau khi đã chạy ở trình duyệt (vì dùng localStorage và xáo trộn ngẫu nhiên) */
export function ClientOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok ? <>{children}</> : <>{fallback ?? <div className="skeleton" />}</>;
}

/** Nút cần bấm 2 lần để xác nhận (dùng cho “Đặt lại tiến độ”) */
export function ConfirmButton({ onConfirm, children, confirmText }: { onConfirm: () => void; children: ReactNode; confirmText: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      className="link-btn danger"
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmText : children}
    </button>
  );
}

/** Nút “Bỏ thuộc tất cả” cho các mục đang chọn (bấm 2 lần để xác nhận) */
export function UnmarkButton({ count, onConfirm, label = "Bỏ thuộc tất cả", unit = "mục" }: { count: number; onConfirm: () => void; label?: string; unit?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  useEffect(() => {
    if (!count) setArmed(false);
  }, [count]);
  return (
    <button
      type="button"
      className={"btn sm unmark" + (armed ? " bad" : "")}
      disabled={!count}
      title={count ? `Bỏ dấu “đã thuộc” của ${count} ${unit} trong phần đang chọn` : "Chưa có mục nào được đánh dấu"}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? `Bấm lần nữa để bỏ ${count} ${unit}` : `${label}${count ? ` (${count})` : ""}`}
    </button>
  );
}

/** Lắng nghe phím tắt trên toàn trang (bỏ qua khi đang gõ trong ô nhập) */
export function useHotkeys(handler: (e: KeyboardEvent) => void, deps: unknown[]) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector(".qs-backdrop, .drawer")) return;
      handler(e);
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Cuộn phần tử lên nếu đầu của nó đã bị trôi khỏi màn hình */
export function scrollIntoViewIfAbove(el: HTMLElement | null) {
  if (!el) return;
  const top = el.getBoundingClientRect().top;
  const header = 76;
  if (top < header) window.scrollTo({ top: window.scrollY + top - header, behavior: "auto" });
}
