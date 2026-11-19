"use client";
/* Khung trắc nghiệm dùng chung: câu hỏi, 4 đáp án, phản hồi, câu trước/sau, chấm nhanh, trang kết quả */
import { useEffect, useRef, type ReactNode } from "react";
import { answered, goTo, isOk, move, pick, rightText, score, wrongItems, type QItem, type Quiz } from "@/lib/quiz";
import { cx } from "@/lib/utils";
import { Meter, scrollIntoViewIfAbove, Segmented, useHotkeys } from "../ui";

export type QuizPlayerProps<M> = {
  quiz: Quiz<M>;
  setQuiz: (q: Quiz<M>) => void;
  renderQuestion: (q: QItem<M>) => ReactNode;
  renderFeedback: (q: QItem<M>, ok: boolean) => ReactNode;
  optionClass?: (q: QItem<M>) => string;
  twoCol?: boolean;
  onAnswer?: (q: QItem<M>, ok: boolean) => void;
  resultMessage: (pct: number) => string;
  renderReview: (q: QItem<M>) => { p: ReactNode; x?: ReactNode };
  reviewJp?: boolean;
  onNew: () => void;
  onRetry: (wrong: QItem<M>[]) => void;
};

export default function QuizPlayer<M>(props: QuizPlayerProps<M>) {
  const { quiz: Q, setQuiz } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const update = (n: Quiz<M> | null, scroll = true) => {
    if (!n) return;
    setQuiz(n);
    if (scroll) requestAnimationFrame(() => scrollIntoViewIfAbove(rootRef.current));
  };

  const doPick = (i: number) => {
    const n = pick(Q, i);
    if (!n) return;
    const q = n.qs[n.i];
    props.onAnswer?.(q, isOk(q));
    setQuiz(n);
  };

  useEffect(() => {
    if (Q.just) nextRef.current?.focus({ preventScroll: true });
  }, [Q.just, Q.i]);

  useHotkeys(
    (e) => {
      if (/^[1-4]$/.test(e.key) && Q.view === "q") doPick(+e.key - 1);
      else if (e.key === "ArrowLeft") {
        const n = move(Q, -1);
        if (n) {
          e.preventDefault();
          update(n);
        }
      } else if (e.key === "ArrowRight") {
        const n = move(Q, 1);
        if (n) {
          e.preventDefault();
          update(n);
        }
      }
    },
    [Q],
  );

  if (Q.view === "r") return <div ref={rootRef}><Result {...props} update={update} /></div>;

  const q = Q.qs[Q.i];
  const isAnswered = q.picked != null;
  const last = Q.i + 1 >= Q.qs.length;
  const all = answered(Q) === Q.qs.length;
  const ok = isAnswered && isOk(q);
  const oc = props.optionClass?.(q) ?? "";

  return (
    <div ref={rootRef}>
      <Meter label={`Câu ${Q.i + 1}/${Q.qs.length} · đúng ${score(Q)}/${answered(Q)}`} value={answered(Q) / Q.qs.length} />
      {props.renderQuestion(q)}
      <div className={cx("options", props.twoCol && "two")}>
        {q.opts.map((o, i) => {
          let cls = "opt";
          if (isAnswered) cls += o.ok ? " correct" : i === q.picked ? " wrong" : " dim";
          return (
            <button key={i} type="button" className={cls} disabled={isAnswered} onClick={() => doPick(i)}>
              <span className="k">{i + 1}</span>
              <span className={cx("t", oc)}>{o.text}</span>
            </button>
          );
        })}
      </div>
      {isAnswered && (
        <div className={"fb " + (ok ? "ok" : "no")} role="status">
          <b>{ok ? "Đúng rồi." : "Chưa đúng."}</b>
          {props.renderFeedback(q, ok)}
        </div>
      )}
      <div className="qnav">
        <button type="button" className="btn" disabled={Q.i === 0} onClick={() => update(move(Q, -1))}>
          ‹ Câu trước
        </button>
        <button ref={nextRef} type="button" className="btn primary" disabled={!isAnswered} onClick={() => update(move(Q, 1))}>
          {last ? "Xem kết quả" : "Câu sau ›"}
        </button>
      </div>
      {all && !last && (
        <div className="actions center">
          <button type="button" className="link-btn" onClick={() => update({ ...Q, view: "r", just: false })}>
            Về trang kết quả
          </button>
        </div>
      )}
      {Q.qs.length <= 40 && (
        <div className="qdots" role="group" aria-label="Chuyển nhanh tới câu">
          {Q.qs.map((x, i) => (
            <button
              key={i}
              type="button"
              className={cx("qdot", x.picked != null && (isOk(x) ? "ok" : "no"))}
              aria-current={i === Q.i ? "true" : undefined}
              disabled={!(x.picked != null || i === Q.i)}
              onClick={() => update(goTo(Q, i), false)}
              aria-label={`Câu ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
      <p className="keys kb">Phím tắt: 1–4 chọn đáp án · ← → câu trước/sau</p>
    </div>
  );
}

function Result<M>(props: QuizPlayerProps<M> & { update: (n: Quiz<M> | null, scroll?: boolean) => void }) {
  const { quiz: Q, update } = props;
  const total = Q.qs.length;
  const sc = score(Q);
  const wrong = wrongItems(Q);
  const f = Q.filter === "all" || !wrong.length ? "all" : "wrong";
  const list = Q.qs.map((q, i) => ({ q, i })).filter((x) => f === "all" || !isOk(x.q));
  const pct = Math.round((sc / total) * 100);
  const firstRef = useRef<HTMLButtonElement>(null);
  useEffect(() => firstRef.current?.focus({ preventScroll: true }), []);

  return (
    <>
      <div className="result">
        <div className="score">
          {sc}/{total}
        </div>
        <div className="pct">{pct}%</div>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          {props.resultMessage(pct)}
        </p>
        <div className="actions center">
          <button ref={firstRef} type="button" className="btn primary" onClick={props.onNew}>
            Vòng mới
          </button>
          {wrong.length ? (
            <button type="button" className="btn" onClick={() => props.onRetry(wrong)}>
              Luyện lại {wrong.length} câu sai
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => update(goTo(Q, 0))}>
              Xem lại từ câu 1
            </button>
          )}
        </div>
      </div>
      <div className="rhead">
        <h3>Xem lại bài làm</h3>
        {wrong.length ? (
          <Segmented
            label="Lọc câu"
            value={f}
            onChange={(v) => update({ ...Q, filter: v }, false)}
            options={[
              ["wrong", `Câu sai (${wrong.length})`],
              ["all", `Tất cả (${total})`],
            ]}
          />
        ) : (
          <span className="cap">Bạn làm đúng tất cả các câu.</span>
        )}
      </div>
      <ol className="rlist">
        {list.map(({ q, i }) => {
          const ok = isOk(q);
          const it = props.renderReview(q);
          const cls = props.reviewJp ? "jp" : undefined;
          return (
            <li key={i} className={ok ? "ok" : "no"}>
              <div className="rtop">
                <span>
                  Câu {i + 1} · {ok ? "Đúng" : "Sai"}
                </span>
                <button type="button" className="link-btn" onClick={() => update(goTo(Q, i))}>
                  Xem lại câu này
                </button>
              </div>
              <div className="rq">{it.p}</div>
              {!ok && (
                <div className="ans">
                  Bạn chọn: <b className={cls}>{q.opts[q.picked!].text}</b>
                </div>
              )}
              <div className="ans">
                Đáp án: <b className={cls}>{rightText(q)}</b>
              </div>
              {it.x}
            </li>
          );
        })}
      </ol>
    </>
  );
}
