"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconLeft, IconRight } from "@/components/icons";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import { ChipPicker, ConfirmButton, Empty, Meter, OptionsPanel, Segmented, Switch, useHotkeys } from "@/components/ui";
import { buildKanjiCtx, kanjiSources, makeKQ, sentTarget, splitSentence, type KQType, type KSrc } from "@/lib/kanjiQuiz";
import { useDoneSet } from "@/lib/progress";
import { newQuiz, type QItem, type Quiz } from "@/lib/quiz";
import { romaji } from "@/lib/romaji";
import { isBool, oneOf, strArray, toggleIn, useStored } from "@/lib/store";
import type { KanjiData, KanjiItem, KanjiSentence } from "@/lib/types";
import { shuffled } from "@/lib/utils";
import KanjiExplain from "./KanjiExplain";

export type VocabUse = { kanji: string; kana: string; vi: string; lesson: number };
type Mode = "cards" | "quiz" | "grid";
type Count = "10" | "20" | "all";

const QTYPES: [KQType, string][] = [
  ["mean", "Kanji → nghĩa"],
  ["read", "Từ → hiragana"],
  ["write", "Hiragana → kanji"],
  ["sread", "Câu: chọn cách đọc"],
  ["swrite", "Câu: chọn chữ kanji"],
  ["mix", "Thi thử (trộn)"],
];

function Sentence({ s, fill }: { s: KanjiSentence; fill?: string }) {
  const p = splitSentence(s.sentence);
  if (!p) return <>{s.sentence}</>;
  return (
    <>
      {p[0]}
      <u>{p[1]}</u>
      {fill && <span className="fill">（{fill}）</span>}
      {p[2]}
    </>
  );
}

export function KanjiDetail({ o, rom, uses }: { o: KanjiItem; rom: boolean; uses?: VocabUse[] }) {
  return (
    <div className="kd">
      <div className="kd-head">
        <span className="kd-big">{o.char}</span>
        <div>
          <div className="kd-hv">{o.hanViet}</div>
          <div className="kd-vi">{o.meaning}</div>
          <div className="kd-grp">
            <span className="tag-sm">
              Kanji {o.groupName} · #{o.n}
            </span>
          </div>
        </div>
      </div>
      <dl className="reads">
        <dt>ON</dt>
        <dd>{o.on}</dd>
        <dt>KUN</dt>
        <dd>{o.kun}</dd>
      </dl>
      <ul className="kex">
        {o.examples.map((x, i) => (
          <li key={i}>
            <span className="w">{x.word}</span>
            <span className="r">
              {x.reading}
              {rom && <span className="rr"> · {romaji(x.reading)}</span>}
            </span>
            <span className="m">{x.meaning}</span>
          </li>
        ))}
      </ul>
      {uses && uses.length > 0 && (
        <div className="vocab-uses">
          <span className="why-h">Từ vựng trong bài học có chữ này</span>
          <ul>
            {uses.map((u, i) => (
              <li key={i}>
                <span className="jp">{u.kanji}</span>
                {u.vi}
                <small>Bài {u.lesson}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function KanjiStudy({ data, uses }: { data: KanjiData; uses: Record<string, VocabUse[]> }) {
  const ctx = useMemo(() => buildKanjiCtx(data), [data]);
  const groups = data.groups;
  const gids = useMemo(() => groups.map((g) => g.id), [groups]);
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "";

  const [sel, setSel] = useStored<string[]>("mnn.ksel", [gids[0]], strArray((s) => gids.includes(s)));
  const [mode, setMode] = useStored<Mode>("mnn.kmode", "cards", oneOf("cards", "quiz", "grid"));
  const [qtype, setQtype] = useStored<KQType>("mnn.kq", "mean", oneOf("mean", "read", "write", "sread", "swrite", "mix"));
  const [count, setCount] = useStored<Count>("mnn.kcount", "10", oneOf("10", "20", "all"));
  const [rom, setRom] = useStored("mnn.rom", true, isBool);
  const { done, toggle, clear } = useDoneSet("kanji");
  const [onlyNew, setOnlyNew] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [pickId, setPickId] = useState<string | null>(null);

  const selSet = useMemo(() => new Set(sel), [sel]);
  const doneRef = useRef(done);
  doneRef.current = done;
  const deck = () => ctx.all.filter((o) => selSet.has(o.group) && (!onlyNew || !doneRef.current.has(o.id)));

  /* ---------- mở theo đường dẫn ?chu=日 (từ trang Từ vựng) ---------- */
  const params = useSearchParams();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const c = params.get("chu");
    const o = c ? ctx.byId.get(c) : undefined;
    if (!o) return;
    if (!sel.includes(o.group)) setSel([...sel, o.group]);
    setMode("grid");
    setPickId(o.id);
    setOnlyNew(false);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
    router.replace("/kanji", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  /* ---------- thẻ ---------- */
  const [order, setOrder] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [flip, setFlip] = useState(false);
  const [quiz, setQuiz] = useState<Quiz<KSrc> | null>(null);

  useEffect(() => {
    const ids = deck().map((o) => o.id);
    setOrder(shuffle ? shuffled(ids) : ids);
    setIdx(0);
    setFlip(false);
    setQuiz(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel.join(","), onlyNew, shuffle]);

  useEffect(() => setQuiz(null), [qtype, count]);

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

  const sources = () => kanjiSources(ctx, qtype, selSet, onlyNew, doneRef.current);
  const startQuiz = (list?: KSrc[]) => {
    let pool = list ?? shuffled(sources());
    if (!list && count !== "all") pool = pool.slice(0, +count);
    setQuiz(pool.length ? newQuiz(pool.map((s) => makeKQ(ctx, s, selSet))) : null);
  };
  const sourceCount = mode === "quiz" ? sources().length : 0;
  useEffect(() => {
    if (mode === "quiz" && !quiz && sourceCount) startQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, quiz, sourceCount, order]);

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
  const chipItems = groups.map((g) => {
    const d = g.items.filter((o) => done.has(o.id)).length;
    return {
      key: g.id,
      title: g.name,
      sub: g.items.slice(0, 5).map((o) => o.char).join(""),
      progress: d / g.items.length,
      tooltip: `${g.name}: ${g.items.map((o) => o.char).join("")} (${d}/${g.items.length} đã thuộc)`,
    };
  });
  const allDone = ctx.all.filter((o) => done.has(o.id)).length;
  chipItems.push({ key: "all", title: "Tất cả", sub: `${allDone}/${ctx.all.length}`, progress: allDone / ctx.all.length, tooltip: "" });

  const selItems = ctx.all.filter((o) => selSet.has(o.group));
  const selDone = selItems.filter((o) => done.has(o.id)).length;
  const names = groups.filter((g) => selSet.has(g.id)).map((g) => g.name);
  const summary = !names.length
    ? "Chưa chọn bài nào."
    : `Đang học ${names.length === groups.length ? "tất cả các bài" : names.join(", ")} · ${selItems.length} chữ · đã thuộc ${selDone}${
        mode === "quiz" ? ` · kho câu hỏi: ${sourceCount} câu` : ""
      }`;

  const emptyView = !sel.length ? (
    <Empty title="Chọn một bài để bắt đầu">Bấm vào các ô Bài ở khung chọn bài. Bạn có thể chọn nhiều bài cùng lúc.</Empty>
  ) : mode === "quiz" && (qtype === "sread" || qtype === "swrite") ? (
    <Empty title="Chưa có câu cho bài đã chọn">
      Dạng câu gạch chân hiện có cho {Array.from(new Set(data.sentences.map((s) => groupName(s.group)))).join(", ")}. Hãy chọn ít nhất một bài trong số
      này.
    </Empty>
  ) : (
    <Empty title="Bạn đã thuộc hết chữ trong phần đã chọn">Tắt “Chỉ chữ chưa thuộc” để ôn lại toàn bộ.</Empty>
  );

  /* ---------- hiển thị ---------- */
  const renderCard = () => {
    const n = order.length;
    const o = ctx.byId.get(order[idx]);
    if (!n || !o) return emptyView;
    return (
      <>
        <Meter label={`Chữ ${idx + 1}/${n}`} value={(idx + 1) / n} />
        <div className={"flash" + (flip ? " flipped" : "")} role="button" tabIndex={0} aria-label="Thẻ kanji, bấm để lật" onClick={() => setFlip((f) => !f)}>
          <span className="tag">
            {o.groupName} · #{o.n}
          </span>
          {done.has(o.id) && <span className="stamp">Đã thuộc</span>}
          <div aria-live="polite" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {!flip ? (
              <>
                <div className="big-kanji">{o.char}</div>
                <div className="hint">Chạm để xem âm Hán Việt, nghĩa và cách đọc</div>
              </>
            ) : (
              <KanjiDetail o={o} rom={rom} uses={uses[o.char]} />
            )}
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
            <button type="button" className="btn" onClick={() => go(-1)} aria-label="Chữ trước">
              <IconLeft /> Trước
            </button>
            <button type="button" className="btn" onClick={() => go(1)} aria-label="Chữ sau">
              Sau <IconRight />
            </button>
          </div>
        </div>
        <p className="keys kb">Phím tắt: Space lật thẻ · ← → chuyển chữ · 1 chưa thuộc · 2 đã thuộc</p>
      </>
    );
  };

  const isBigOpt = (q: QItem<KSrc>) => q.meta.k === "write" || (q.meta.k === "sent" && ctx.sentById.get(q.meta.id)!.type === "write");
  const answerWord = (q: QItem<KSrc>) => {
    const m = q.meta;
    if (m.k === "mean") return ctx.byId.get(m.id)!.char;
    if (m.k === "sent") {
      const s = ctx.sentById.get(m.id)!;
      return s.type === "read" ? sentTarget(s) : s.options[0];
    }
    return m.id;
  };

  const renderQuiz = () => {
    if (!quiz) return sourceCount ? <div className="skeleton" /> : emptyView;
    return (
      <QuizPlayer
        quiz={quiz}
        setQuiz={setQuiz}
        twoCol
        optionClass={(q) => (q.meta.k === "mean" ? "" : isBigOpt(q) ? "kanji-opt" : "jp-opt")}
        renderQuestion={(q) => {
          const m = q.meta;
          if (m.k === "mean") {
            const o = ctx.byId.get(m.id)!;
            return (
              <div className="q-box">
                <div className="big-kanji">{o.char}</div>
                <div className="hint">Chữ này có âm Hán Việt và nghĩa là gì?</div>
              </div>
            );
          }
          if (m.k === "read" || m.k === "write") {
            const e = ctx.words.get(m.id)!;
            return (
              <div className="q-box">
                <div className="big-jp">{m.k === "read" ? e.w : e.r}</div>
                <div className="hint">{m.k === "read" ? "Từ này đọc là gì? Chọn cách viết bằng hiragana." : "Từ này viết bằng kanji thế nào?"}</div>
              </div>
            );
          }
          const s = ctx.sentById.get(m.id)!;
          return (
            <div className="q-box left">
              <span className="q-label">
                {groupName(s.group)} · {s.type === "read" ? "Cách đọc" : "Cách viết"}
              </span>
              <div className="q-sentence">
                <Sentence s={s} fill={q.picked != null ? s.options[0] : undefined} />
              </div>
              <div className="q-instr">{s.type === "read" ? "Từ gạch chân đọc là gì?" : "Từ gạch chân viết bằng kanji thế nào?"}</div>
            </div>
          );
        }}
        renderFeedback={(q, ok) => {
          const m = q.meta;
          if (m.k === "mean") {
            const o = ctx.byId.get(m.id)!;
            return (
              <>
                {" "}
                <span className="jp">{o.char}</span> ({o.hanViet}) nghĩa là “{o.meaning}”. On: {o.on} · Kun: {o.kun}.{" "}
                <span className="muted">Kanji {o.groupName}.</span>
              </>
            );
          }
          const wrongPick = q.opts[q.picked!].text;
          const showWrong = !ok && isBigOpt(q);
          if (m.k === "read" || m.k === "write") {
            const e = ctx.words.get(m.id)!;
            return (
              <>
                {" "}
                <span className="jp">{e.w}</span> đọc là <span className="jp">{e.r}</span> ({romaji(e.r)}), nghĩa là “{e.m}”.
                <KanjiExplain word={e.w} byId={ctx.byId} />
                {showWrong && <KanjiExplain word={wrongPick} byId={ctx.byId} title="Chữ bạn đã chọn (khác với đáp án)" skip={e.w} />}
              </>
            );
          }
          const s = ctx.sentById.get(m.id)!;
          const tg = sentTarget(s);
          const w = s.type === "read" ? tg : s.options[0];
          const rd = s.type === "read" ? s.options[0] : tg;
          return (
            <>
              {" "}
              <span className="jp">{w}</span> đọc là <span className="jp">{rd}</span> ({romaji(rd)}), nghĩa là “{s.wordMeaning}”.
              <KanjiExplain word={w} byId={ctx.byId} />
              {s.tip && (
                <div className="why">
                  <span className="why-h">Mẹo nhớ</span>
                  {s.tip}
                </div>
              )}
              <div className="why">
                <span className="why-h">Nghĩa của câu</span>
                {s.meaning}
              </div>
              {showWrong && <KanjiExplain word={wrongPick} byId={ctx.byId} title="Chữ bạn đã chọn (khác với đáp án)" skip={w} />}
            </>
          );
        }}
        resultMessage={(pct) =>
          pct === 100
            ? "Trọn điểm. Thử thêm bài khác hoặc đổi kiểu câu hỏi."
            : pct >= 70
              ? "Khá tốt. Xem lại các câu sai bên dưới rồi làm vòng mới."
              : "Cần ôn thêm. Dùng thẻ ghi nhớ cho bài này rồi quay lại làm trắc nghiệm."
        }
        renderReview={(q) => {
          const m = q.meta;
          const p =
            m.k === "mean" ? (
              <span className="jp" style={{ fontSize: 24 }}>
                {ctx.byId.get(m.id)!.char}
              </span>
            ) : m.k === "read" ? (
              <span className="jp">{m.id}</span>
            ) : m.k === "write" ? (
              <span className="jp">{ctx.words.get(m.id)!.r}</span>
            ) : (
              <span className="jp">
                <Sentence s={ctx.sentById.get(m.id)!} />
              </span>
            );
          return { p, x: m.k === "mean" ? undefined : <KanjiExplain word={answerWord(q)} byId={ctx.byId} /> };
        }}
        reviewJp
        onNew={() => startQuiz()}
        onRetry={(wr) => startQuiz(wr.map((x) => x.meta))}
      />
    );
  };

  const renderGrid = () => {
    const list = deck();
    if (!list.length) return emptyView;
    const cur = (pickId && list.find((x) => x.id === pickId)) || list[0];
    const isDone = done.has(cur.id);
    const firstOf = new Map(groups.map((g) => [g.items[0]?.id, g.name]));
    return (
      <>
        <div className="kpanel" ref={panelRef} style={{ scrollMarginTop: 80 }}>
          <KanjiDetail o={cur} rom={rom} uses={uses[cur.char]} />
          <div className="actions">
            <button type="button" className={"btn" + (isDone ? "" : " primary")} onClick={() => toggle(cur.id)}>
              {isDone ? "Bỏ đánh dấu đã thuộc" : "Đánh dấu đã thuộc"}
            </button>
          </div>
        </div>
        <p className="keys">Chạm vào một chữ để xem chi tiết. Ô màu xanh là chữ đã thuộc.</p>
        <div className="kgrid">
          {list.map((o) => {
            const fg = firstOf.get(o.id);
            return (
              <button
                key={o.id}
                type="button"
                className={"kt" + (done.has(o.id) ? " done" : "")}
                aria-pressed={o.id === cur.id}
                aria-label={`${fg ? fg + ", " : ""}${o.char} ${o.hanViet}`}
                onClick={() => {
                  setPickId(o.id);
                  requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
                }}
              >
                {fg && <span className="kb">{fg}</span>}
                <span className="c">{o.char}</span>
                <span className="h">{o.hanViet}</span>
              </button>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="study">
      <aside className="study-side">
        <section className="panel">
          <div className="panel-title">
            <h2>Chọn bài kanji</h2>
            <span className="small muted">{ctx.all.length} chữ</span>
          </div>
          <ChipPicker
            label="Chọn bài kanji"
            wide
            items={chipItems}
            selected={(k) => (k === "all" ? sel.length === groups.length : selSet.has(k))}
            onToggle={(k) => {
              if (k === "all") setSel(sel.length === groups.length ? [] : gids);
              else setSel(toggleIn(sel, k));
            }}
          />
          <p className="summary">{summary}</p>
        </section>
        <OptionsPanel>
          {mode === "quiz" && (
            <>
              <span className="field-label">Kiểu câu hỏi</span>
              <Segmented label="Kiểu câu hỏi" className="vertical" value={qtype} onChange={setQtype} options={QTYPES} />
              <span className="field-label">Số câu mỗi vòng</span>
              <Segmented
                label="Số câu mỗi vòng"
                value={count}
                onChange={setCount}
                options={[
                  ["10", "10 câu"],
                  ["20", "20 câu"],
                  ["all", "Tất cả"],
                ]}
              />
            </>
          )}
          <div className="switches">
            {!(mode === "quiz" && (qtype === "sread" || qtype === "swrite")) && (
              <Switch checked={onlyNew} onChange={setOnlyNew}>
                Chỉ chữ chưa thuộc
              </Switch>
            )}
            {mode === "cards" && (
              <Switch checked={shuffle} onChange={setShuffle}>
                Xáo trộn thẻ
              </Switch>
            )}
            <Switch checked={rom} onChange={setRom}>
              Hiện romaji ở từ ví dụ
            </Switch>
          </div>
          <div className="summary">
            <ConfirmButton onConfirm={clear} confirmText="Bấm lần nữa để xóa toàn bộ tiến độ kanji">
              Đặt lại tiến độ kanji
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
          }}
          options={[
            ["cards", "Thẻ ghi nhớ"],
            ["quiz", "Trắc nghiệm"],
            ["grid", "Bảng chữ"],
          ]}
        />
        <div className="section">{mode === "cards" ? renderCard() : mode === "quiz" ? renderQuiz() : renderGrid()}</div>
        <p className="keys">
          Mẹo: trong trang <Link href="/tu-vung">Từ vựng</Link>, bấm vào chữ kanji của một từ để mở chữ đó ở đây.
        </p>
      </div>
    </div>
  );
}

