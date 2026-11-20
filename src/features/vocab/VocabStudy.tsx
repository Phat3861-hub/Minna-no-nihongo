"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IconLeft, IconRight } from "@/components/icons";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import { ChipPicker, ConfirmButton, Empty, Meter, OptionsPanel, Segmented, Switch, UnmarkButton, useHotkeys } from "@/components/ui";
import KanjiBreakdown from "@/components/vocab/KanjiBreakdown";
import WordRow, { GroupTag, verbGroupOf } from "@/components/vocab/WordRow";
import { useDoneSet } from "@/lib/progress";
import { buildOptions, newQuiz, type Quiz } from "@/lib/quiz";
import { romaji } from "@/lib/romaji";
import { isBool, numArray, oneOf, toggleIn, useStored } from "@/lib/store";
import type { KanjiBrief, VocabLesson, VocabWord } from "@/lib/types";
import { hasKanji, jpLabel, lessonLabel, shuffled } from "@/lib/utils";

type Mode = "cards" | "quiz" | "list";
type Dir = "jv" | "vj";
type Meta = { w: VocabWord };

export default function VocabStudy({
  lessons,
  kanjiIndex,
  verbGroups,
}: {
  lessons: VocabLesson[];
  kanjiIndex: Record<string, KanjiBrief>;
  verbGroups: Record<string, number>;
}) {
  const N = lessons.length;
  const all = useMemo(() => lessons.flatMap((l) => l.words), [lessons]);
  const byId = useMemo(() => new Map(all.map((w) => [w.id, w])), [all]);

  const [sel, setSel] = useStored<number[]>("mnn.sel", [1], numArray((n) => n >= 1 && n <= N));
  const [mode, setMode] = useStored<Mode>("mnn.mode", "cards", oneOf("cards", "quiz", "list"));
  const [dir, setDir] = useStored<Dir>("mnn.dir", "jv", oneOf("jv", "vj"));
  const [rom, setRom] = useStored("mnn.rom", true, isBool);
  const [showKb, setShowKb] = useStored("mnn.kb", true, isBool);
  const { done, toggle, clear, removeMany } = useDoneSet("vocab");

  const [onlyNew, setOnlyNew] = useState(false);
  const [onlyKanji, setOnlyKanji] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [hide, setHide] = useState(false);
  const [rev, setRev] = useState<Set<string>>(new Set());

  const selSet = useMemo(() => new Set(sel), [sel]);
  const doneRef = useRef(done);
  doneRef.current = done;

  const deck = () =>
    all.filter((w) => selSet.has(w.lesson) && (!onlyNew || !doneRef.current.has(w.id)) && (!onlyKanji || hasKanji(w)));

  /* ---------- thẻ ghi nhớ ---------- */
  const [order, setOrder] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [flip, setFlip] = useState(false);
  const [quiz, setQuiz] = useState<Quiz<Meta> | null>(null);

  useEffect(() => {
    const ids = deck().map((w) => w.id);
    setOrder(shuffle ? shuffled(ids) : ids);
    setIdx(0);
    setFlip(false);
    setQuiz(null);
    setRev(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel.join(","), onlyNew, shuffle, onlyKanji]);

  useEffect(() => {
    setQuiz(null);
    setFlip(false);
    setRev(new Set());
  }, [dir]);

  const go = (d: number) => {
    const n = order.length;
    if (!n) return;
    setIdx((i) => (i + d + n) % n);
    setFlip(false);
  };
  const mark = (v: boolean) => {
    const id = order[idx];
    if (!id) return;
    toggle(id, v);
    go(1);
  };

  /* ---------- trắc nghiệm ---------- */
  const qLabel = (x: VocabWord) => (dir === "jv" ? x.vi : jpLabel(x));
  const makeQ = (w: VocabWord) => {
    const near = shuffled(all.filter((x) => x.id !== w.id && selSet.has(x.lesson)));
    const far = shuffled(all.filter((x) => x.id !== w.id && !selSet.has(x.lesson)));
    return { id: w.id, meta: { w }, opts: shuffled(buildOptions(qLabel(w), near.concat(far).map(qLabel))) };
  };
  const startQuiz = (words?: VocabWord[]) => {
    const pool = words ?? shuffled(deck()).slice(0, 10);
    setQuiz(pool.length ? newQuiz(pool.map(makeQ)) : null);
  };
  useEffect(() => {
    if (mode === "quiz" && !quiz && order.length) startQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, quiz, order]);

  useHotkeys(
    (e) => {
      if (mode !== "cards") return;
      const t = e.target as HTMLElement;
      const onCard = t === document.body || t.classList.contains("flash");
      if (e.key === "ArrowRight") {
        go(1);
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        go(-1);
        e.preventDefault();
      } else if ((e.key === " " || e.key === "Enter") && onCard) {
        if (order.length) setFlip((f) => !f);
        e.preventDefault();
      } else if (e.key === "1") mark(false);
      else if (e.key === "2") mark(true);
    },
    [mode, order, idx, done],
  );

  /* ---------- chọn bài ---------- */
  const chipItems = lessons.map((L) => {
    const d = L.words.filter((w) => done.has(w.id)).length;
    return { key: String(L.lesson), title: `Bài ${L.lesson}`, sub: `${d}/${L.words.length}`, progress: d / L.words.length, tooltip: L.title };
  });
  const allDone = all.filter((w) => done.has(w.id)).length;
  chipItems.push({ key: "all", title: "Tất cả", sub: `${allDone}/${all.length}`, progress: allDone / all.length, tooltip: `Bài 1–${N}` });

  const selWords = all.filter((w) => selSet.has(w.lesson));
  const selDone = selWords.filter((w) => done.has(w.id)).length;
  const summary = !sel.length
    ? "Chưa chọn bài nào."
    : `Đang ôn ${lessonLabel(sel, N)}${sel.length === 1 ? ` (${lessons[sel[0] - 1]?.title ?? ""})` : ""} · ${selWords.length} từ · đã thuộc ${selDone}`;

  const emptyView = !sel.length ? (
    <Empty title="Chọn một bài để bắt đầu">Bấm vào các ô Bài ở khung chọn bài. Bạn có thể chọn nhiều bài cùng lúc.</Empty>
  ) : (
    <Empty title="Không còn từ nào trong phần đã chọn">Tắt “Chỉ từ chưa thuộc” hoặc “Chỉ từ có kanji” để ôn lại toàn bộ.</Empty>
  );

  /* ---------- hiển thị ---------- */
  const renderCard = () => {
    const n = order.length;
    const w = byId.get(order[idx]);
    if (!n || !w) return emptyView;
    const isDone = done.has(w.id);
    const g = verbGroupOf(w, verbGroups);
    const kanjiLine = hasKanji(w) ? <div className="sub-jp">{w.kanji}</div> : null;
    const back = (
      <>
        {rom && <div className="rom">{romaji(w.kana)}</div>}
        {w.note && <div className="note">{w.note}</div>}
        {g > 0 && (
          <div style={{ marginTop: 10 }}>
            <GroupTag g={g} />
          </div>
        )}
        {hasKanji(w) && <KanjiBreakdown text={w.kanji} index={kanjiIndex} />}
      </>
    );
    let face;
    if (dir === "jv")
      face = !flip ? (
        <>
          <div className="big-jp">{w.kana}</div>
          {kanjiLine}
          <div className="hint">Chạm để xem nghĩa{hasKanji(w) ? ", phân tích kanji" : ""}</div>
        </>
      ) : (
        <>
          <div className="big-vi">{w.vi}</div>
          <div className="sub-jp">{jpLabel(w)}</div>
          {back}
        </>
      );
    else
      face = !flip ? (
        <>
          <div className="big-vi">{w.vi}</div>
          <div className="hint">Chạm để xem tiếng Nhật</div>
        </>
      ) : (
        <>
          <div className="big-jp">{w.kana}</div>
          {kanjiLine}
          {back}
        </>
      );
    return (
      <>
        <Meter label={`Thẻ ${idx + 1}/${n}`} value={(idx + 1) / n} />
        <div
          className={"flash" + (flip ? " flipped" : "")}
          role="button"
          tabIndex={0}
          aria-label="Thẻ từ vựng, bấm để lật"
          onClick={() => setFlip((f) => !f)}
        >
          <span className="tag">Bài {w.lesson}</span>
          {isDone && <span className="stamp">Đã thuộc</span>}
          <div aria-live="polite" style={{ width: "100%" }}>
            {face}
          </div>
        </div>
        <div className="card-actions">
          <button type="button" className="btn bad" onClick={() => mark(false)}>
            Chưa thuộc
          </button>
          <button type="button" className="btn good" onClick={() => mark(true)}>
            Đã thuộc
          </button>
          <div className="nav-pair">
            <button type="button" className="btn" onClick={() => go(-1)} aria-label="Thẻ trước">
              <IconLeft /> Trước
            </button>
            <button type="button" className="btn" onClick={() => go(1)} aria-label="Thẻ sau">
              Sau <IconRight />
            </button>
          </div>
        </div>
        <p className="keys kb">Phím tắt: Space lật thẻ · ← → chuyển thẻ · 1 chưa thuộc · 2 đã thuộc</p>
      </>
    );
  };

  const renderQuiz = () => {
    if (!quiz) return order.length ? <div className="skeleton" /> : emptyView;
    return (
      <QuizPlayer
        quiz={quiz}
        setQuiz={setQuiz}
        twoCol
        optionClass={() => (dir === "vj" ? "jp-opt" : "")}
        renderQuestion={(q) => {
          const w = q.meta.w;
          return (
            <div className="q-box">
              {dir === "jv" ? (
                <>
                  <div className="big-jp">{w.kana}</div>
                  {hasKanji(w) && <div className="sub-jp">{w.kanji}</div>}
                </>
              ) : (
                <div className="big-vi">{w.vi}</div>
              )}
            </div>
          );
        }}
        renderFeedback={(q) => {
          const w = q.meta.w;
          return (
            <>
              <span className="jp">{jpLabel(w)}</span>
              {rom ? ` (${romaji(w.kana)})` : ""} nghĩa là “{w.vi}”.{w.note ? ` ${w.note}.` : ""}
              {hasKanji(w) && (
                <div className="why">
                  <span className="why-h">Chữ kanji trong từ</span>
                  <KanjiBreakdown text={w.kanji} index={kanjiIndex} align="left" />
                </div>
              )}
            </>
          );
        }}
        resultMessage={(pct) =>
          pct === 100
            ? "Trọn điểm. Bạn có thể thử nhóm bài khác hoặc đổi hướng Việt → Nhật."
            : pct >= 70
              ? "Khá tốt. Ôn lại các từ sai bên dưới rồi làm vòng mới."
              : "Cần ôn thêm. Dùng thẻ ghi nhớ cho các bài này rồi quay lại làm trắc nghiệm."
        }
        renderReview={(q) => ({
          p: (
            <>
              <span className="jp">{jpLabel(q.meta.w)}</span> · {q.meta.w.vi}
            </>
          ),
        })}
        reviewJp={dir !== "jv"}
        onNew={() => startQuiz()}
        onRetry={(wr) => startQuiz(wr.map((x) => x.meta.w))}
      />
    );
  };

  const renderList = () => {
    const shown = lessons.filter((L) => selSet.has(L.lesson));
    if (!shown.length) return emptyView;
    let count = 0;
    const secs = shown.map((L) => {
      const ws = L.words.filter((w) => (!onlyNew || !done.has(w.id)) && (!onlyKanji || hasKanji(w)));
      if (!ws.length) return null;
      count += ws.length;
      const d = L.words.filter((w) => done.has(w.id)).length;
      return (
        <section className="lsec" key={L.lesson}>
          <div className="lsec-h">
            <span className="badge">Bài {L.lesson}</span>
            <h3>{L.title}</h3>
            <em>
              {d}/{L.words.length} đã thuộc
            </em>
            {d > 0 && (
              <UnmarkButton label="Bỏ thuộc bài này" count={d} unit="từ" onConfirm={() => removeMany(L.words.map((w) => w.id))} />
            )}
          </div>
          <ul className="words">
            {ws.map((w) => {
              const hJ = hide && dir === "vj" && !rev.has(w.id);
              const hV = hide && dir === "jv" && !rev.has(w.id);
              return (
                <WordRow
                  key={w.id}
                  w={w}
                  done={done.has(w.id)}
                  onTick={() => toggle(w.id)}
                  showRom={rom}
                  kanjiIndex={kanjiIndex}
                  showKanji={showKb}
                  verbGroups={verbGroups}
                  hideJp={hJ}
                  hideVi={hV}
                  onReveal={() => setRev((r) => new Set(r).add(w.id))}
                />
              );
            })}
          </ul>
        </section>
      );
    });
    return count ? <>{secs}</> : emptyView;
  };

  return (
    <div className="study">
      <aside className="study-side">
        <section className="panel">
          <div className="panel-title">
            <h2>Chọn bài</h2>
            <span className="small muted">chọn được nhiều bài</span>
          </div>
          <ChipPicker
            label="Chọn bài"
            items={chipItems}
            selected={(k) => (k === "all" ? sel.length === N : selSet.has(+k))}
            onToggle={(k) => {
              if (k === "all") setSel(sel.length === N ? [] : lessons.map((l) => l.lesson));
              else setSel(toggleIn(sel, +k));
            }}
          />
          <p className="summary">{summary}</p>
          <div className="summary-actions">
            <UnmarkButton count={selDone} unit="từ" onConfirm={() => removeMany(selWords.map((w) => w.id))} />
          </div>
        </section>
        <OptionsPanel>
          <span className="field-label">Hướng ôn</span>
          <Segmented
            label="Hướng ôn"
            value={dir}
            onChange={setDir}
            options={[
              ["jv", "Nhật → Việt"],
              ["vj", "Việt → Nhật"],
            ]}
          />
          <div className="switches">
            <Switch checked={onlyNew} onChange={setOnlyNew}>
              Chỉ từ chưa thuộc
            </Switch>
            <Switch checked={onlyKanji} onChange={setOnlyKanji}>
              Chỉ từ có kanji
            </Switch>
            <Switch checked={rom} onChange={setRom}>
              Hiện phiên âm romaji
            </Switch>
            {mode === "cards" && (
              <Switch checked={shuffle} onChange={setShuffle}>
                Xáo trộn thẻ
              </Switch>
            )}
            {mode === "list" && (
              <>
                <Switch checked={showKb} onChange={setShowKb}>
                  Phân tích chữ kanji
                </Switch>
                <Switch
                  checked={hide}
                  onChange={(v) => {
                    setHide(v);
                    setRev(new Set());
                  }}
                >
                  Che đáp án
                </Switch>
              </>
            )}
          </div>
          <div className="summary">
            <ConfirmButton onConfirm={clear} confirmText="Bấm lần nữa để xóa toàn bộ tiến độ từ vựng">
              Đặt lại tiến độ
            </ConfirmButton>
          </div>
        </OptionsPanel>
      </aside>

      <div className="study-main">
        <Segmented
          label="Chế độ"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setFlip(false);
            setRev(new Set());
          }}
          options={[
            ["cards", "Thẻ ghi nhớ"],
            ["quiz", "Trắc nghiệm"],
            ["list", "Danh sách"],
          ]}
        />
        <div className="section">{mode === "cards" ? renderCard() : mode === "quiz" ? renderQuiz() : renderList()}</div>
      </div>
    </div>
  );
}
