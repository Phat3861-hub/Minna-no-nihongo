"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import { ChipPicker, ConfirmButton, Empty, OptionsPanel, Segmented, Switch } from "@/components/ui";
import { useDoneSet } from "@/lib/progress";
import { newQuiz, rightText, type QItem, type Quiz } from "@/lib/quiz";
import { numArray, oneOf, toggleIn, useStored } from "@/lib/store";
import type { ExerciseQuestion } from "@/lib/types";
import { lessonLabel, shuffled } from "@/lib/utils";

type Count = "10" | "20" | "all";
type Meta = { o: ExerciseQuestion };

/** Hiển thị câu hỏi với chỗ trống （　） */
function Blank({ q, fill }: { q: string; fill?: string }) {
  const parts = q.split("（　）");
  if (parts.length === 1) return <>{q}</>;
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p}
          {i < parts.length - 1 &&
            (fill && parts.length === 2 ? <span className="blank filled">{fill}</span> : <span className="blank">　　</span>)}
        </Fragment>
      ))}
    </>
  );
}

export default function ExerciseStudy({ lessons, questions }: { lessons: { lesson: number; title: string }[]; questions: ExerciseQuestion[] }) {
  const N = lessons.length;
  const [sel, setSel] = useStored<number[]>("mnn.esel", [1], numArray((n) => n >= 1 && n <= N));
  const [count, setCount] = useStored<Count>("mnn.ecount", "10", oneOf("10", "20", "all"));
  const { done, toggle, clear } = useDoneSet("exercise");
  const [onlyNew, setOnlyNew] = useState(false);
  const [quiz, setQuiz] = useState<Quiz<Meta> | null>(null);
  const selSet = useMemo(() => new Set(sel), [sel]);

  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const b = Number(params.get("bai"));
    if (b >= 1 && b <= N) {
      setSel([b]);
      router.replace("/bai-tap", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const deck = () => questions.filter((o) => selSet.has(o.lesson) && (!onlyNew || !done.has(o.id)));
  const make = (o: ExerciseQuestion) => ({ id: o.id, meta: { o }, opts: shuffled(o.options.map((t, i) => ({ text: t, ok: i === o.answer }))) });
  const start = (list?: ExerciseQuestion[]) => {
    let pool = list ?? shuffled(deck());
    if (!list && count !== "all") pool = pool.slice(0, +count);
    setQuiz(pool.length ? newQuiz(pool.map(make)) : null);
  };
  const deckSize = deck().length;
  useEffect(() => setQuiz(null), [sel.join(","), count, onlyNew]);
  useEffect(() => {
    if (!quiz && deckSize) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, deckSize]);

  const chipItems = lessons.map((L) => {
    const ws = questions.filter((o) => o.lesson === L.lesson);
    const d = ws.filter((o) => done.has(o.id)).length;
    return { key: String(L.lesson), title: `Bài ${L.lesson}`, sub: `${d}/${ws.length}`, progress: ws.length ? d / ws.length : 0, tooltip: L.title };
  });
  const allDone = questions.filter((o) => done.has(o.id)).length;
  chipItems.push({ key: "all", title: "Tất cả", sub: `${allDone}/${questions.length}`, progress: allDone / questions.length, tooltip: "" });

  const items = questions.filter((o) => selSet.has(o.lesson));
  const selDone = items.filter((o) => done.has(o.id)).length;
  const summary = !sel.length ? "Chưa chọn bài nào." : `Đang làm ${lessonLabel(sel, N)} · ${items.length} câu · đã làm đúng ${selDone}`;

  const emptyView = !sel.length ? (
    <Empty title="Chọn một bài để bắt đầu">Bấm vào các ô Bài ở khung chọn bài. Bạn có thể chọn nhiều bài cùng lúc.</Empty>
  ) : (
    <Empty title="Bạn đã làm đúng hết các câu trong phần đã chọn">Tắt “Chỉ câu chưa làm đúng” để làm lại toàn bộ.</Empty>
  );

  const fillText = (q: QItem<Meta>) => {
    if (q.picked == null) return undefined;
    const t = rightText(q);
    return t.charAt(0) !== "（" && !t.includes("…") ? t : undefined;
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
            label="Chọn bài tập"
            items={chipItems}
            selected={(k) => (k === "all" ? sel.length === N : selSet.has(+k))}
            onToggle={(k) => {
              if (k === "all") setSel(sel.length === N ? [] : lessons.map((l) => l.lesson));
              else setSel(toggleIn(sel, +k));
            }}
          />
          <p className="summary">{summary}</p>
        </section>
        <OptionsPanel>
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
          <div className="switches">
            <Switch checked={onlyNew} onChange={setOnlyNew}>
              Chỉ câu chưa làm đúng
            </Switch>
          </div>
          <div className="summary">
            <ConfirmButton onConfirm={clear} confirmText="Bấm lần nữa để xóa tiến độ bài tập">
              Đặt lại tiến độ bài tập
            </ConfirmButton>
          </div>
        </OptionsPanel>
      </aside>
      <div className="study-main">
        {!quiz ? (
          deckSize ? <div className="skeleton" /> : emptyView
        ) : (
          <QuizPlayer
            quiz={quiz}
            setQuiz={setQuiz}
            optionClass={() => "jp-opt"}
            onAnswer={(q, ok) => toggle(q.id, ok)}
            renderQuestion={(q) => {
              const o = q.meta.o;
              return (
                <div className="q-box left">
                  <span className="q-label">
                    <Link href={`/ngu-phap/bai-${o.lesson}`} style={{ color: "inherit" }}>
                      Bài {o.lesson}
                    </Link>
                  </span>
                  <div className="q-sentence">
                    <Blank q={o.question} fill={fillText(q)} />
                  </div>
                  {o.instruction && <div className="q-instr">{o.instruction}</div>}
                  {o.hint && <div className="q-instr">Gợi ý: {o.hint}</div>}
                </div>
              );
            }}
            renderFeedback={(q, ok) => {
              const o = q.meta.o;
              return (
                <>
                  {!ok && (
                    <>
                      {" "}
                      Đáp án đúng là <b className="jp">{rightText(q)}</b>.
                    </>
                  )}
                  {o.meaning && (
                    <div className="why">
                      <span className="why-h">Nghĩa của câu</span>
                      {o.meaning}
                    </div>
                  )}
                  <div className="why">
                    <span className="why-h">Giải thích ngữ pháp</span>
                    {o.explanation}
                  </div>
                </>
              );
            }}
            resultMessage={(pct) =>
              pct === 100
                ? "Trọn điểm. Bạn có thể chọn thêm bài khác hoặc làm vòng mới."
                : pct >= 70
                  ? "Khá tốt. Xem lại các câu sai bên dưới rồi làm vòng mới."
                  : "Cần ôn thêm. Đọc lại phần Ngữ pháp của các bài này rồi quay lại làm bài tập."
            }
            renderReview={(q) => {
              const o = q.meta.o;
              return {
                p: (
                  <>
                    <span className="tag-sm">Bài {o.lesson}</span>{" "}
                    <span className="jp">
                      <Blank q={o.question} />
                    </span>
                  </>
                ),
                x: (
                  <>
                    {o.meaning && <div className="why">Nghĩa: {o.meaning}</div>}
                    <div className="why">{o.explanation}</div>
                  </>
                ),
              };
            }}
            reviewJp
            onNew={() => start()}
            onRetry={(wr) => start(wr.map((x) => x.meta.o))}
          />
        )}
      </div>
    </div>
  );
}
