"use client";

import Link from "next/link";
import { romaji } from "@/lib/romaji";
import type { KanjiBrief, VocabWord } from "@/lib/types";
import { cx, hasKanji } from "@/lib/utils";
import { IconCheck } from "../icons";
import KanjiBreakdown from "./KanjiBreakdown";

export const GROUP_NAME = ["", "Nhóm I", "Nhóm II", "Nhóm III"];

export function verbGroupOf(w: VocabWord, groups?: Record<string, number>) {
  if (!groups) return 0;
  const strip = (s: string) => s.replace(/^\[[^\]]*\]/, "");
  const kana = strip(w.kana);
  return groups[`${kana}|${strip(w.kanji)}`] || groups[kana] || 0;
}

export function GroupTag({ g }: { g: number }) {
  if (!g) return null;
  return (
    <Link href="/ngu-phap/nhom-dong-tu" className={`grp g${g}`} title="Xem bài Nhóm động từ" onClick={(e) => e.stopPropagation()}>
      Động từ {GROUP_NAME[g]}
    </Link>
  );
}

export default function WordRow({
  w,
  done,
  onTick,
  showRom = true,
  kanjiIndex,
  showKanji = true,
  verbGroups,
  hideJp = false,
  hideVi = false,
  onReveal,
  showLesson = false,
}: {
  w: VocabWord;
  done: boolean;
  onTick: () => void;
  showRom?: boolean;
  kanjiIndex?: Record<string, KanjiBrief>;
  showKanji?: boolean;
  verbGroups?: Record<string, number>;
  hideJp?: boolean;
  hideVi?: boolean;
  onReveal?: () => void;
  showLesson?: boolean;
}) {
  const g = verbGroupOf(w, verbGroups);
  const revealProps = (hidden: boolean) =>
    hidden
      ? {
          role: "button",
          tabIndex: 0,
          "aria-label": "Bấm để hiện",
          onClick: onReveal,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onReveal?.();
            }
          },
        }
      : {};
  return (
    <li className={cx("row", done && "is-done")}>
      <button type="button" className="tick" aria-pressed={done} aria-label={`Đã thuộc: ${w.kana}`} onClick={onTick}>
        <IconCheck />
      </button>
      <div className={cx("jpc", hideJp && "masked")} {...revealProps(hideJp)}>
        <span className="kn">{w.kana}</span>
        {hasKanji(w) && <span className="kj">{w.kanji}</span>}
        {showRom && <small className="rm">{romaji(w.kana)}</small>}
      </div>
      <div className={cx("vic", hideVi && "masked")} {...revealProps(hideVi)}>
        <span>
          {w.vi} {g > 0 && <GroupTag g={g} />}
        </span>
        {w.note && <small>{w.note}</small>}
        {showLesson && <span className="lb">Bài {w.lesson}</span>}
      </div>
      {showKanji && kanjiIndex && hasKanji(w) && !hideJp && (
        <KanjiBreakdown text={w.kanji} index={kanjiIndex} align="left" compact />
      )}
    </li>
  );
}
