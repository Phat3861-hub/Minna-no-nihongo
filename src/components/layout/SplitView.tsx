"use client";
/*
 * Chia đôi màn hình: trang hiện tại ở bên trái, bên phải là một mục khác (hiển thị trong khung riêng).
 * Hai bên dùng chung tiến độ học (localStorage) và giao diện sáng/tối.
 */
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isBool, useStored } from "@/lib/store";
import { IconClose, IconSwap } from "../icons";

export const SPLIT_VIEWS = [
  { key: "search", href: "/tim-tu", label: "Tìm từ" },
  { key: "vocab", href: "/tu-vung", label: "Từ vựng" },
  { key: "kanji", href: "/kanji", label: "Kanji" },
  { key: "grammar", href: "/ngu-phap", label: "Ngữ pháp" },
  { key: "verbs", href: "/ngu-phap/nhom-dong-tu", label: "Nhóm động từ" },
  { key: "exercise", href: "/bai-tap", label: "Bài tập ngữ pháp" },
  { key: "speak", href: "/luyen-noi", label: "Luyện nói" },
  { key: "num", href: "/so-dem", label: "Số – giờ – ngày" },
] as const;

type ViewKey = (typeof SPLIT_VIEWS)[number]["key"];
const viewOf = (k: string) => SPLIT_VIEWS.find((v) => v.key === k);
const keyOfPath = (path: string): ViewKey | null => {
  let best: (typeof SPLIT_VIEWS)[number] | null = null;
  for (const v of SPLIT_VIEWS) if (path === v.href || path.startsWith(v.href + "/")) if (!best || v.href.length > best.href.length) best = v;
  return best?.key ?? null;
};

/** Bật/tắt chia đôi (dùng chung giữa nút trên header và khung bên phải) */
export function useSplit() {
  return useStored("mnn.split", false, isBool);
}

export function useIsEmbedded() {
  const [v, setV] = useState(false);
  useEffect(() => {
    try {
      setV(window.self !== window.top);
    } catch {
      setV(true);
    }
  }, []);
  return v;
}

export default function SplitView() {
  const [split, setSplit] = useSplit();
  const [right, setRight] = useStored<ViewKey>("mnn.right", "search", (v) => (viewOf(v as string) ? (v as ViewKey) : undefined));
  const [width, setWidth] = useStored<number>("mnn.splitw", 50, (v) => (typeof v === "number" && v >= 25 && v <= 75 ? v : undefined));
  const [dragging, setDragging] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const embedded = useIsEmbedded();
  const pathname = usePathname() || "/";
  const router = useRouter();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const on = split && !embedded;

  // Khi trang bên trái trùng với mục bên phải thì tự chọn mục khác
  const leftKey = keyOfPath(pathname);
  const pendingRight = useRef<ViewKey | null>(null);
  useEffect(() => {
    if (pendingRight.current) {
      // vừa bấm “Đổi bên”: đặt mục bên phải sau khi trang bên trái đã chuyển xong
      if (leftKey !== pendingRight.current) {
        setRight(pendingRight.current);
        pendingRight.current = null;
      }
      return;
    }
    if (on && leftKey && leftKey === right) setRight(leftKey === "search" ? "vocab" : "search");
  }, [on, leftKey, right, setRight]);

  useEffect(() => {
    setSrc(viewOf(right)!.href);
  }, [right]);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("split-on", on);
    el.style.setProperty("--split-w", String(width));
    return () => el.classList.remove("split-on");
  }, [on, width]);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    const move = (ev: PointerEvent) => {
      const w = ((window.innerWidth - ev.clientX) / window.innerWidth) * 100;
      setWidth(Math.round(Math.min(75, Math.max(25, w))));
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /** Đổi bên: trang bên phải sang bên trái và ngược lại */
  const swap = () => {
    let rightPath: string = viewOf(right)!.href;
    try {
      rightPath = frameRef.current?.contentWindow?.location.pathname || rightPath;
    } catch {
      /* bỏ qua */
    }
    pendingRight.current = keyOfPath(pathname);
    router.push(rightPath);
  };

  if (!on) return null;
  return (
    <>
      <div
        className={"split-handle" + (dragging ? " dragging" : "")}
        onPointerDown={startDrag}
        onDoubleClick={() => setWidth(50)}
        role="separator"
        aria-orientation="vertical"
        aria-label="Kéo để đổi độ rộng hai bên (bấm đúp để chia đều)"
        aria-valuenow={width}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setWidth(Math.min(75, width + 5));
          if (e.key === "ArrowRight") setWidth(Math.max(25, width - 5));
        }}
      />
      <aside className={"split-pane" + (dragging ? " dragging" : "")} aria-label="Màn hình bên phải">
        <div className="split-bar">
          <span className="lbl">Bên phải</span>
          <select value={right} onChange={(e) => setRight(e.target.value as ViewKey)} aria-label="Chọn mục hiển thị bên phải">
            {SPLIT_VIEWS.map((v) => (
              <option key={v.key} value={v.key} disabled={v.key === leftKey}>
                {v.label}
              </option>
            ))}
          </select>
          <button type="button" className="icon-btn" onClick={swap} aria-label="Đổi bên" title="Đổi bên trái ↔ phải">
            <IconSwap />
          </button>
          <button type="button" className="icon-btn" onClick={() => setSplit(false)} aria-label="Tắt chia đôi" title="Tắt chia đôi">
            <IconClose />
          </button>
        </div>
        {src && <iframe ref={frameRef} key={src} src={src} title={viewOf(right)!.label} />}
      </aside>
    </>
  );
}
