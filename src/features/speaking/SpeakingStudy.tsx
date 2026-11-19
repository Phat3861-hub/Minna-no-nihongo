"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { IconSpeaker } from "@/components/icons";
import { ChipPicker, Empty, Meter, OptionsPanel, Segmented, Switch, scrollIntoViewIfAbove, useHotkeys } from "@/components/ui";
import { RUBY_RE, rubyKana, sentenceRomaji } from "@/lib/romaji";
import { isBool, oneOf, useStored } from "@/lib/store";
import type { SpeakingData, SpeakingItem } from "@/lib/types";
import { shuffled } from "@/lib/utils";

/** {chữ|đọc} → <ruby> (hoặc chỉ chữ khi tắt furigana) */
function Ruby({ s, furi }: { s: string; furi: boolean }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of s.matchAll(RUBY_RE)) {
    out.push(s.slice(last, m.index));
    out.push(
      furi ? (
        <ruby key={m.index}>
          {m[1]}
          <rt>{m[2]}</rt>
        </ruby>
      ) : (
        <Fragment key={m.index}>{m[1]}</Fragment>
      ),
    );
    last = m.index! + m[0].length;
  }
  out.push(s.slice(last));
  return <>{out}</>;
}

function useTTS() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk("speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined"), []);
  const say = (text: string) => {
    if (!ok) return;
    try {
      const u = new SpeechSynthesisUtterance(rubyKana(text).replace(/～/g, ""));
      u.lang = "ja-JP";
      u.rate = 0.85;
      const vs = window.speechSynthesis.getVoices().filter((v) => /^ja/i.test(v.lang));
      if (vs.length) u.voice = vs[0];
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* bỏ qua */
    }
  };
  return { ok, say };
}

export default function SpeakingStudy({ data }: { data: SpeakingData }) {
  const all = useMemo(() => data.sections.flatMap((s) => s.items), [data]);
  const secIds = data.sections.map((s) => s.id);
  const [sec, setSec] = useStored<string>("mnn.spsec", "all", (v) => (v === "all" || secIds.includes(v as string) ? (v as string) : undefined));
  const [mode, setMode] = useStored<"list" | "prac">("mnn.spmode", "list", oneOf("list", "prac"));
  const [furi, setFuri] = useStored("mnn.spfuri", true, isBool);
  const [rom, setRom] = useStored("mnn.sprom", false, isBool);
  const [shuf, setShuf] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const tts = useTTS();
  const byId = useMemo(() => new Map(all.map((o) => [o.id, o])), [all]);
  const secName = (id: string) => data.sections.find((s) => s.id === id)?.title ?? "";

  useEffect(() => {
    const ids = all.filter((o) => sec === "all" || o.section === sec).map((o) => o.id);
    setOrder(shuf ? shuffled(ids) : ids);
    setIdx(0);
    setShow(0);
  }, [sec, shuf, all]);

  const moveTo = (d: number) => {
    const j = idx + d;
    if (j < 0 || j >= order.length) return;
    setIdx(j);
    setShow(0);
    requestAnimationFrame(() => scrollIntoViewIfAbove(stageRef.current));
  };

  useHotkeys(
    (e) => {
      if (mode !== "prac") return;
      if (e.key === "ArrowRight") {
        moveTo(1);
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        moveTo(-1);
        e.preventDefault();
      } else if (e.key === " " && !/^(BUTTON|A)$/.test((e.target as HTMLElement).tagName)) {
        setShow((s) => Math.min(2, s + 1));
        e.preventDefault();
      }
    },
    [mode, idx, order],
  );

  const line = (s: string, cls: string) => (
    <div className={"sp-line " + cls}>
      <div className="sp-jp">
        <Ruby s={s} furi={furi} />
        {rom && <span className="sp-rom">{sentenceRomaji(s)}</span>}
      </div>
      {tts.ok && (
        <button type="button" className="spk" aria-label="Nghe đọc" onClick={() => tts.say(s)}>
          <IconSpeaker />
        </button>
      )}
    </div>
  );

  const answers = (o: SpeakingItem) => (
    <>
      <div className="sp-a">
        <span className="why-h">Câu trả lời mẫu</span>
        {o.answers.map((a, i) => (
          <div className="sp-arow" key={i}>
            {line(a.jp, "")}
            <div className="sp-vi">{a.vi}</div>
          </div>
        ))}
      </div>
      {o.tip && (
        <p className="gp-note">
          <b>Mẹo.</b> {o.tip}
        </p>
      )}
    </>
  );

  const card = (o: SpeakingItem) => (
    <article className="gp">
      <div className="gp-n">{o.n}</div>
      <div>
        {line(o.question, "sp-q")}
        <p className="gp-m">{o.meaning}</p>
        <p className="sp-g">
          Ngữ pháp: <b>{o.grammar}</b>
        </p>
        {answers(o)}
      </div>
    </article>
  );

  const helpBlock = (
    <section className="panel" style={{ marginBottom: 16 }}>
      <h3>Câu cứu nguy khi thi</h3>
      <p className="cap">Dùng khi không nghe rõ hoặc chưa hiểu câu hỏi. Đừng im lặng, hãy nói một trong các câu sau.</p>
      {data.help.map((x, i) => (
        <div className="sp-arow" key={i}>
          {line(x.jp, "")}
          <div className="sp-vi">{x.vi}</div>
        </div>
      ))}
      <ul className="gp-d" style={{ marginTop: 12 }}>
        <li>Câu hỏi có／không (～ますか, ～ですか không có từ để hỏi): bắt đầu bằng はい／いいえ.</li>
        <li>Câu hỏi có từ để hỏi (なに, どこ, だれ, いつ, なんじ, なんで…): không nói はい／いいえ, trả lời thẳng thông tin.</li>
        <li>Giữ đúng thì: hỏi ～ますか → trả lời ～ます; hỏi ～ましたか → trả lời ～ました.</li>
        <li>Nói về gia đình mình dùng 父, 母, 兄, 姉 (không dùng お父さん, お母さん…).</li>
        <li>Trả lời thành câu đầy đủ, nói chậm và rõ. Có thể nói thêm một câu để ghi điểm (ví dụ: とても おいしかったです).</li>
      </ul>
    </section>
  );

  const renderList = () => (
    <>
      {sec === "all" && helpBlock}
      {data.sections
        .filter((s) => sec === "all" || s.id === sec)
        .map((s) => (
          <section key={s.id} style={{ marginBottom: 24 }}>
            <h2 className="section-title" style={{ marginTop: 8 }}>
              {s.title}{" "}
              <span className="jp muted" style={{ fontWeight: 500, fontSize: 15 }}>
                <Ruby s={s.jp} furi={furi} />
              </span>
              <span className="tag-sm">{s.items.length} câu</span>
            </h2>
            {s.items.map((o) => (
              <div key={o.id} style={{ marginTop: 12 }}>{card(o)}</div>
            ))}
          </section>
        ))}
    </>
  );

  const renderPrac = () => {
    const n = order.length;
    const o = byId.get(order[idx]);
    if (!n || !o) return <Empty title="Không có câu hỏi" />;
    return (
      <div ref={stageRef}>
        <Meter label={`Câu ${idx + 1}/${n}`} value={(idx + 1) / n} />
        <div className="q-box left">
          <span className="q-label">
            {secName(o.section)} · câu {o.n}
          </span>
          {line(o.question, "sp-q sp-big")}
          {show >= 1 ? (
            <>
              <p className="gp-m">{o.meaning}</p>
              <p className="sp-g">
                Ngữ pháp: <b>{o.grammar}</b>
              </p>
            </>
          ) : (
            <p className="q-instr">Hãy tự trả lời to bằng tiếng Nhật trước, rồi mới xem gợi ý.</p>
          )}
        </div>
        {show < 2 && (
          <div className="actions">
            {show < 1 && (
              <button type="button" className="btn" onClick={() => setShow(1)}>
                Xem nghĩa và gợi ý ngữ pháp
              </button>
            )}
            <button type="button" className="btn primary" onClick={() => setShow(2)}>
              Xem câu trả lời mẫu
            </button>
          </div>
        )}
        {show >= 2 && (
          <div className="fb ok">
            {answers(o)}
          </div>
        )}
        <div className="qnav">
          <button type="button" className="btn" disabled={idx === 0} onClick={() => moveTo(-1)}>
            ‹ Câu trước
          </button>
          <button type="button" className="btn primary" disabled={idx + 1 >= n} onClick={() => moveTo(1)}>
            Câu sau ›
          </button>
        </div>
        <p className="keys kb">Phím tắt: ← → chuyển câu · Space xem gợi ý / câu trả lời mẫu</p>
      </div>
    );
  };

  const chipItems = [
    { key: "all", title: "Tất cả", sub: `${all.length} câu` },
    ...data.sections.map((s) => ({ key: s.id, title: s.title, sub: `${s.items.length} câu` })),
  ];

  return (
    <div className="study">
      <aside className="study-side">
        <section className="panel">
          <div className="panel-title">
            <h2>Chủ đề</h2>
          </div>
          <ChipPicker label="Chọn chủ đề" wide items={chipItems} selected={(k) => k === sec} onToggle={setSec} />
        </section>
        <OptionsPanel>
          <div className="switches">
            <Switch checked={furi} onChange={setFuri}>
              Hiện furigana
            </Switch>
            <Switch checked={rom} onChange={setRom}>
              Hiện romaji
            </Switch>
            {mode === "prac" && (
              <Switch checked={shuf} onChange={setShuf}>
                Hỏi ngẫu nhiên
              </Switch>
            )}
          </div>
          {tts.ok && <p className="cap" style={{ marginTop: 8 }}>Bấm biểu tượng loa để nghe đọc.</p>}
        </OptionsPanel>
      </aside>
      <div className="study-main">
        <Segmented
          label="Chế độ"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setShow(0);
          }}
          options={[
            ["list", "Hướng dẫn trả lời"],
            ["prac", "Luyện tập từng câu"],
          ]}
        />
        <div className="section">{mode === "list" ? renderList() : renderPrac()}</div>
      </div>
    </div>
  );
}
