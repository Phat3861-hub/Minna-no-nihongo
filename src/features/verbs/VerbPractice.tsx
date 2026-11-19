"use client";

import { useEffect, useState } from "react";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import { Segmented } from "@/components/ui";
import { newQuiz, type Quiz } from "@/lib/quiz";
import { oneOf, useStored } from "@/lib/store";
import type { Verb } from "@/lib/types";
import { FORM_NAME, GROUP_LABEL, makeVerbQ, ruleText, verbQuestions, type VMeta, type VQType } from "@/lib/verbs";

const TYPES: [VQType, string][] = [
  ["group", "Nhóm mấy?"],
  ["te", "Thể て"],
  ["nai", "Thể ない"],
  ["dict", "Thể từ điển"],
  ["ta", "Thể た"],
  ["mix", "Trộn"],
];

export default function VerbPractice({ verbs }: { verbs: Verb[] }) {
  const [type, setType] = useStored<VQType>("mnn.vq", "group", oneOf("group", "te", "nai", "dict", "ta", "mix"));
  const [count, setCount] = useStored<"10" | "20" | "all">("mnn.vcount", "10", oneOf("10", "20", "all"));
  const [quiz, setQuiz] = useState<Quiz<VMeta> | null>(null);
  const start = () => setQuiz(newQuiz(verbQuestions(verbs, type, count === "all" ? "all" : +count)));
  useEffect(() => start(), [type, count]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <Segmented label="Kiểu câu hỏi" value={type} onChange={setType} options={TYPES} />
        <Segmented
          label="Số câu"
          value={count}
          onChange={setCount}
          options={[
            ["10", "10 câu"],
            ["20", "20 câu"],
            ["all", "Tất cả"],
          ]}
        />
      </div>
      {quiz && (
        <QuizPlayer
          quiz={quiz}
          setQuiz={setQuiz}
          twoCol
          optionClass={(q) => (q.meta.kind === "group" ? "" : "jp-opt")}
          renderQuestion={(q) => {
            const { v, kind } = q.meta;
            return (
              <div className="q-box">
                <span className="q-label">{kind === "group" ? "Động từ này thuộc nhóm nào?" : `Chia sang ${FORM_NAME[kind]}`}</span>
                <div className="big-jp">{v.masu}</div>
                <div className="sub-jp">
                  {v.kanji && <span>{v.kanji} · </span>}
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: 16 }}>{v.vi}</span>
                </div>
                {kind !== "group" && (
                  <div className="hint">
                    <span className={`grp g${v.group}`}>{GROUP_LABEL[v.group]}</span>
                  </div>
                )}
              </div>
            );
          }}
          renderFeedback={(q) => {
            const { v, kind } = q.meta;
            if (kind === "group")
              return (
                <>
                  {" "}
                  <span className="jp">{v.masu}</span> thuộc <b>{GROUP_LABEL[v.group]}</b>.
                  <div className="why">
                    <span className="why-h">Vì sao</span>
                    {v.group === 3
                      ? "Nhóm III gồm します, きます (đến) và Danh từ + します."
                      : v.exception
                        ? v.exception + "."
                        : `Âm trước ます là ${v.masu.slice(-3, -2)}, thuộc hàng ${v.group === 1 ? "い → Nhóm I" : "え → Nhóm II"}.`}
                  </div>
                  <div className="why">
                    <span className="why-h">Các thể</span>
                    <span className="jp">
                      て: {v.forms.te} · ない: {v.forms.nai} · từ điển: {v.forms.dict} · た: {v.forms.ta}
                    </span>
                  </div>
                </>
              );
            return (
              <>
                {" "}
                <span className="jp">{v.masu}</span> → <b className="jp">{v.forms[kind]}</b>
                <div className="why">
                  <span className="why-h">Quy tắc</span>
                  {ruleText(v, kind)}
                </div>
              </>
            );
          }}
          resultMessage={(pct) =>
            pct === 100
              ? "Trọn điểm! Thử kiểu câu hỏi khác hoặc chế độ Trộn."
              : pct >= 70
                ? "Khá tốt. Xem lại các câu sai và quy tắc ở mục 3."
                : "Cần ôn thêm. Đọc lại mục 1 và mục 3 rồi làm vòng mới."
          }
          renderReview={(q) => ({
            p: (
              <>
                <span className="jp">{q.meta.v.masu}</span> · {q.meta.kind === "group" ? "Nhóm mấy?" : FORM_NAME[q.meta.kind]}
              </>
            ),
            x: q.meta.kind === "group" ? undefined : <div className="why">{ruleText(q.meta.v, q.meta.kind)}</div>,
          })}
          reviewJp
          onNew={() => start()}
          onRetry={(wr) => setQuiz(newQuiz(wr.map((x) => makeVerbQ(x.meta.v, x.meta.kind, verbs))))}
        />
      )}
    </div>
  );
}
