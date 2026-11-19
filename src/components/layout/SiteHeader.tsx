"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV, isActive, isGroup, type NavGroup } from "@/lib/nav";
import type { KanjiBrief, VocabWord } from "@/lib/types";
import { IconChevron, IconClose, IconColumns, IconMenu, IconSearch } from "../icons";
import QuickSearch from "./QuickSearch";
import SplitView, { useSplit } from "./SplitView";
import ThemeToggle from "./ThemeToggle";

function Dropdown({ g, pathname }: { g: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = g.items.some((it) => isActive(pathname, it.href));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      className="nav-drop"
      ref={ref}
      onMouseEnter={() => {
        clearTimeout(timer.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        timer.current = setTimeout(() => setOpen(false), 160);
      }}
    >
      <button
        type="button"
        className={"nav-trigger" + (active ? " active" : "")}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        {g.label}
        <IconChevron className="chev" />
      </button>
      {open && (
        <div className="nav-menu" role="menu">
          {g.items.map((it) => (
            <Link key={it.href} href={it.href} role="menuitem" aria-current={isActive(pathname, it.href) ? "page" : undefined}>
              <span className="mi">{it.icon}</span>
              <b>
                {it.label} {it.isNew && <span className="badge-new">MỚI</span>}
              </b>
              <small>{it.desc}</small>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SiteHeader({ words, kanjiIndex }: { words: VocabWord[]; kanjiIndex: Record<string, KanjiBrief> }) {
  const pathname = usePathname() || "/";
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const [split, setSplit] = useSplit();

  useEffect(() => setDrawer(false), [pathname]);

  // Phím tắt mở tìm nhanh: Ctrl/⌘ + K hoặc "/"
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSearch(true);
      } else if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setSearch(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link href="/" className="brand" aria-label="Trang chủ">
            <span className="brand-seal">み</span>
            <span className="brand-text">
              <b>Minna no Nihongo</b>
              <span>みんなの日本語 I · N5</span>
            </span>
          </Link>

          <nav className="nav" aria-label="Điều hướng chính">
            {NAV.filter((e) => isGroup(e) || e.href !== "/tim-tu").map((e) =>
              isGroup(e) ? (
                <Dropdown key={e.label} g={e} pathname={pathname} />
              ) : (
                <Link key={e.href} href={e.href} className="nav-link" aria-current={isActive(pathname, e.href) ? "page" : undefined}>
                  {e.label}
                </Link>
              ),
            )}
          </nav>

          <div className="header-actions">
            <button type="button" className="search-btn" onClick={() => setSearch(true)}>
              <IconSearch />
              Tìm từ vựng…
              <kbd>Ctrl K</kbd>
            </button>
            <button type="button" className="icon-btn search-icon-btn" onClick={() => setSearch(true)} aria-label="Tìm từ vựng">
              <IconSearch />
            </button>
            <button
              type="button"
              className="icon-btn split-btn"
              aria-pressed={split}
              onClick={() => setSplit(!split)}
              aria-label={split ? "Tắt chia đôi màn hình" : "Chia đôi màn hình"}
              title={split ? "Tắt chia đôi màn hình" : "Chia đôi màn hình"}
            >
              <IconColumns />
            </button>
            <ThemeToggle />
            <button type="button" className="icon-btn menu-btn" onClick={() => setDrawer(true)} aria-label="Mở menu" aria-expanded={drawer}>
              <IconMenu />
            </button>
          </div>
        </div>
      </header>

      {drawer && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawer(false)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="drawer-head">
              <Link href="/" className="brand">
                <span className="brand-seal">み</span>
                <span className="brand-text">
                  <b>Minna no Nihongo</b>
                  <span>みんなの日本語 I · N5</span>
                </span>
              </Link>
              <button type="button" className="icon-btn" onClick={() => setDrawer(false)} aria-label="Đóng menu">
                <IconClose />
              </button>
            </div>
            <div className="drawer-body">
              <Link href="/" className="drawer-link" aria-current={pathname === "/" ? "page" : undefined}>
                <span className="mi">家</span>
                <span>
                  Trang chủ<small>Tổng quan tiến độ học</small>
                </span>
              </Link>
              {(() => {
                const gi = NAV.findIndex(isGroup);
                const link = (it: { href: string; icon: string; label: string; desc: string; isNew?: boolean }) => (
                  <Link key={it.href} href={it.href} className="drawer-link" aria-current={isActive(pathname, it.href) ? "page" : undefined}>
                    <span className="mi">{it.icon}</span>
                    <span>
                      {it.label} {it.isNew && <span className="badge-new">MỚI</span>}
                      <small>{it.desc}</small>
                    </span>
                  </Link>
                );
                return NAV.map((e, i) =>
                  isGroup(e) ? (
                    <div key={e.label}>
                      <div className="drawer-sec">{e.label}</div>
                      {e.items.map(link)}
                    </div>
                  ) : (
                    <div key={e.href}>
                      {i === 0 && <div className="drawer-sec">Học</div>}
                      {i === gi + 1 && <div className="drawer-sec">Luyện tập & tra cứu</div>}
                      {link(e)}
                    </div>
                  ),
                );
              })()}
            </div>
            <div className="drawer-foot">
              <span className="muted small">Giao diện sáng / tối</span>
              <ThemeToggle />
            </div>
          </aside>
        </>
      )}

      <SplitView />

      {search && <QuickSearch words={words} kanjiIndex={kanjiIndex} onClose={() => setSearch(false)} />}
    </>
  );
}
