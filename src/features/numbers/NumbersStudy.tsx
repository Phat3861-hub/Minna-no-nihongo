"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Segmented } from "@/components/ui";
import {
  D1,
  HR,
  SPECIAL_DAYS,
  WK_K,
  dateRead,
  dayKana,
  fmt,
  genPractice,
  minKana,
  monthKana,
  numKana,
  timeRead,
  weekKana,
  yearKana,
  type NumTab,
} from "@/lib/numbers";
import { romaji } from "@/lib/romaji";
import { oneOf, useStored } from "@/lib/store";

type Item = { big: string; kana: string; irr?: boolean; alt?: string };
const item = (big: string, kana: string, irr = false, alt = ""): Item => ({ big, kana, irr, alt });
const LEGEND = "Ô tô màu là cách đọc đặc biệt, cần học thuộc.";

function Grid({ items }: { items: Item[] }) {
  return (
    <div className="rg">
      {items.map((x, i) => (
        <div key={i} className={"rc" + (x.irr ? " irr" : "")}>
          <b>{x.big}</b>
          <span className="k">{x.kana}</span>
          <span className="r">{romaji(x.kana)}</span>
          {x.alt && <span className="a">{x.alt}</span>}
        </div>
      ))}
    </div>
  );
}

function Block({ title, cap, children }: { title: string; cap?: string; children: ReactNode }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {cap && <p className="cap">{cap}</p>}
      {children}
    </section>
  );
}

function Rules({ list }: { list: string[] }) {
  return (
    <ul className="rules">
      {list.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

function Out({ src, kana, extra }: { src: string; kana: string; extra?: string }) {
  return (
    <div className="out" aria-live="polite">
      <div className="o-src">{src}</div>
      <div className="o-kana">{kana}</div>
      <div className="o-rom">{romaji(kana)}</div>
      {extra && <div className="o-extra">{extra}</div>}
    </div>
  );
}

const todayStr = () => {
  const d = new Date();
  const p = (x: number) => (x < 10 ? "0" : "") + x;
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

function Converter({ tab }: { tab: NumTab }) {
  const [num, setNum] = useState("34500");
  const [h, setH] = useState("15");
  const [m, setM] = useState("15");
  const [date, setDate] = useState(todayStr);
  const msg = (t: string) => <p className="cap" style={{ marginTop: 12 }}>{t}</p>;

  let out: ReactNode;
  if (tab === "number") {
    const n = /^\d+$/.test(num.trim()) ? parseInt(num, 10) : -1;
    out = n < 0 || n > 99999999 ? msg("Nhập số nguyên từ 0 đến 99.999.999.") : <Out src={fmt(n)} kana={numKana(n)} />;
  } else if (tab === "time") {
    const hh = /^\d+$/.test(h.trim()) ? parseInt(h, 10) : -1;
    const mm = /^\d+$/.test(m.trim()) ? parseInt(m, 10) : -1;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) out = msg("Nhập giờ từ 0 đến 23 và phút từ 0 đến 59.");
    else {
      const tr = timeRead(hh, mm);
      const p = (x: number) => (x < 10 ? "0" : "") + x;
      out = <Out src={`${tr.kanji}  (${p(hh)}:${p(mm)})`} kana={tr.kana} extra={tr.alt ? `Cách khác: ${tr.alt}` : ""} />;
    }
  } else {
    const mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    let ok = false;
    let dr: ReturnType<typeof dateRead> | null = null;
    if (mt) {
      const y = +mt[1],
        mo = +mt[2],
        d = +mt[3],
        dt = new Date(y, mo - 1, d);
      if (y >= 1000 && dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) {
        ok = true;
        dr = dateRead(y, mo, d);
      }
    }
    out = ok && dr ? <Out src={dr.kanji} kana={dr.kana} /> : msg("Chọn một ngày hợp lệ.");
  }

  const title = tab === "number" ? "Nhập số để xem cách đọc" : tab === "time" ? "Nhập giờ để xem cách đọc" : "Chọn ngày để xem cách đọc";
  return (
    <Block title={title}>
      <div className="conv" style={{ marginTop: 10 }}>
        {tab === "number" && (
          <label className="fld">
            Số (0 đến 99.999.999)
            <input className="input" type="number" inputMode="numeric" min={0} max={99999999} value={num} onChange={(e) => setNum(e.target.value)} />
          </label>
        )}
        {tab === "time" && (
          <>
            <label className="fld sm">
              Giờ (0–23)
              <input className="input" type="number" inputMode="numeric" min={0} max={23} value={h} onChange={(e) => setH(e.target.value)} />
            </label>
            <label className="fld sm">
              Phút (0–59)
              <input className="input" type="number" inputMode="numeric" min={0} max={59} value={m} onChange={(e) => setM(e.target.value)} />
            </label>
          </>
        )}
        {tab === "date" && (
          <label className="fld">
            Ngày
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        )}
      </div>
      {out}
    </Block>
  );
}

function Practice({ tab }: { tab: NumTab }) {
  const [p, setP] = useState(() => ({ ...genPractice(tab), shown: false }));
  useEffect(() => setP({ ...genPractice(tab), shown: false }), [tab]);
  return (
    <Block title="Luyện đọc" cap="Đọc to trước, rồi bấm để kiểm tra.">
      <div className="out">
        <div className="o-src">{p.src}</div>
        {p.shown ? (
          <>
            <div className="o-kana">{p.kana}</div>
            <div className="o-rom">{romaji(p.kana)}</div>
          </>
        ) : (
          <div className="hint">Đọc thử trước, rồi bấm “Hiện cách đọc”.</div>
        )}
      </div>
      <div className="actions">
        <button type="button" className={"btn" + (p.shown ? "" : " primary")} disabled={p.shown} onClick={() => setP({ ...p, shown: true })}>
          Hiện cách đọc
        </button>
        <button type="button" className={"btn" + (p.shown ? " primary" : "")} onClick={() => setP({ ...genPractice(tab), shown: false })}>
          Câu khác
        </button>
      </div>
    </Block>
  );
}

function NumberRef() {
  const basic = [item("0", "ゼロ", true, "cũng đọc れい")];
  for (let i = 1; i <= 10; i++) {
    const alt = i === 4 ? "cũng đọc し" : i === 7 ? "cũng đọc しち" : i === 9 ? "cũng đọc く" : "";
    basic.push(item(String(i), i === 10 ? "じゅう" : D1[i], !!alt, alt));
  }
  const tens: Item[] = [],
    hund: Item[] = [],
    thou: Item[] = [];
  for (let i = 1; i <= 9; i++) {
    tens.push(item(String(i * 10), numKana(i * 10)));
    hund.push(item(String(i * 100), numKana(i * 100), i === 3 || i === 6 || i === 8));
    thou.push(item(fmt(i * 1000), numKana(i * 1000), i === 3 || i === 8, i === 1 ? "không thêm いち" : ""));
  }
  const man = [10000, 20000, 100000, 1000000, 10000000].map((n) =>
    item(fmt(n), numKana(n), n === 10000000, n === 10000 ? "phải có いち" : n === 10000000 ? "đọc いっせん" : ""),
  );
  const misc = [
    item("1歳", "いっさい", true), item("2歳", "にさい"), item("8歳", "はっさい", true), item("10歳", "じゅっさい", true), item("20歳", "はたち", true), item("何歳", "なんさい"),
    item("1階", "いっかい", true), item("3階", "さんがい", true), item("6階", "ろっかい", true), item("8階", "はっかい", true), item("10階", "じゅっかい", true), item("何階", "なんがい", true),
    item("4円", "よえん", true), item("7円", "ななえん", false, "cũng đọc しちえん"), item("1,000円", "せんえん"), item("10,000円", "いちまんえん"),
  ];
  return (
    <>
      <Block title="Số cơ bản 0–10" cap={LEGEND}><Grid items={basic} /></Block>
      <Block title="Hàng chục" cap="Số + じゅう"><Grid items={tens} /></Block>
      <Block title="Hàng trăm" cap="Số + ひゃく"><Grid items={hund} /></Block>
      <Block title="Hàng nghìn" cap="Số + せん"><Grid items={thou} /></Block>
      <Block title="Hàng vạn trở lên" cap="Người Nhật đếm theo vạn (まん = 10.000)"><Grid items={man} /></Block>
      <Block title="Tuổi, tầng, tiền" cap="Các cách đọc hay gặp trong Bài 1 và Bài 3"><Grid items={misc} /></Block>
      <Block title="Quy tắc cần nhớ">
        <Rules
          list={[
            "Đọc từ trái sang phải: số + じゅう (chục), số + ひゃく (trăm), số + せん (nghìn), số + まん (vạn).",
            "10 là じゅう, 100 là ひゃく, 1000 là せん, không thêm いち. Riêng 10.000 phải đọc いちまん.",
            "Biến âm: 300 さんびゃく, 600 ろっぴゃく, 800 はっぴゃく; 3000 さんぜん, 8000 はっせん.",
            "Đếm theo vạn: 100.000 là じゅうまん (10 vạn), 1.000.000 là ひゃくまん (100 vạn).",
            "Số 4, 7, 9 có hai cách đọc. Khi đếm số bình thường dùng よん, なな, きゅう.",
          ]}
        />
      </Block>
    </>
  );
}

function TimeRef() {
  const hrs: Item[] = [];
  for (let i = 1; i <= 12; i++) hrs.push(item(i + "時", HR[i] + "じ", i === 4 || i === 7 || i === 9));
  const mins: Item[] = [];
  const isP = (m: number) => /ぷん$/.test(minKana(m));
  for (let i = 1; i <= 10; i++) mins.push(item(i + "分", minKana(i), isP(i)));
  [15, 20, 30, 40, 45, 50].forEach((m) => mins.push(item(m + "分", minKana(m), isP(m))));
  mins.push(item("半", "はん", false, "rưỡi (30 phút)"));
  return (
    <>
      <Block title="Giờ 1–12" cap="Số + じ"><Grid items={hrs} /></Block>
      <Block title="Phút" cap="Số + ふん hoặc ぷん. Ô tô màu là các phút đọc ぷん."><Grid items={mins} /></Block>
      <Block title="Quy tắc cần nhớ">
        <Rules
          list={[
            "Giờ: số + じ. Ba giờ đặc biệt: 4時 よじ, 7時 しちじ, 9時 くじ.",
            "Phút: đuôi 2, 5, 7, 9 đọc ふん. Đuôi 1, 3, 4, 6, 8, 10 đọc ぷん, và 1, 6, 8, 10 biến âm thành いっ, ろっ, はっ, じゅっ.",
            "30 phút thường nói là 半 (はん): 3時半 さんじはん.",
            "午前 (ごぜん) là buổi sáng, 午後 (ごご) là buổi chiều tối, đặt trước giờ: 午後3時 ごご さんじ.",
            "Hỏi giờ: 何時 なんじ, hỏi phút: 何分 なんぷん. Khoảng thời gian: ～から～まで (từ ... đến ...).",
          ]}
        />
      </Block>
    </>
  );
}

function DateRef() {
  const mon: Item[] = [],
    days: Item[] = [],
    wk: Item[] = [],
    yr: Item[] = [];
  for (let i = 1; i <= 12; i++) mon.push(item(i + "月", monthKana(i), i === 4 || i === 7 || i === 9));
  for (let i = 1; i <= 31; i++) days.push(item(i + "日", dayKana(i), !!SPECIAL_DAYS[i]));
  const elem = ["Mặt Trời", "Mặt Trăng", "Lửa", "Nước", "Cây", "Vàng, kim loại", "Đất"];
  [1, 2, 3, 4, 5, 6, 0].forEach((w) => wk.push(item(WK_K[w] + "曜日", weekKana(w), false, elem[w])));
  ([[1, false], [2, false], [4, true], [7, true], [9, true]] as [number, boolean][]).forEach(([y, irr]) =>
    yr.push(item(y + "年", yearKana(y), irr, y === 7 ? "cũng đọc しちねん" : "")),
  );
  yr.push(item("2000年", yearKana(2000)), item("2026年", yearKana(2026)), item("何年", "なんねん"));
  return (
    <>
      <Block title="Tháng" cap="Số + がつ"><Grid items={mon} /></Block>
      <Block title="Ngày" cap={"Ngày 1–10, 14, 20, 24 đọc riêng. Các ngày còn lại: số + にち. " + LEGEND}><Grid items={days} /></Block>
      <Block title="Thứ" cap="Tên thứ + ようび"><Grid items={wk} /></Block>
      <Block title="Năm" cap="Số + ねん"><Grid items={yr} /></Block>
      <Block title="Quy tắc cần nhớ">
        <Rules
          list={[
            "Thứ tự nói: năm, tháng, ngày, thứ. Ví dụ 2026年10月15日（木） đọc là にせんにじゅうろくねん じゅうがつ じゅうごにち もくようび.",
            "Tháng: số + がつ. Ba tháng đặc biệt: 4月 しがつ, 7月 しちがつ, 9月 くがつ.",
            "Ngày 17, 19, 27, 29 dùng しち và く: じゅうしちにち, じゅうくにち, にじゅうしちにち, にじゅうくにち.",
            "Năm: số + ねん. Riêng 4年 よねん, 7年 ななねん, 9年 くねん.",
            "Hỏi: 何月 なんがつ, 何日 なんにち, 何曜日 なんようび, 何年 なんねん. Hỏi “khi nào” là いつ.",
          ]}
        />
      </Block>
    </>
  );
}

export default function NumbersStudy() {
  const [tab, setTab] = useStored<NumTab>("mnn.ntab", "number", oneOf("number", "time", "date"));
  return (
    <>
      <Segmented
        label="Nội dung"
        value={tab}
        onChange={setTab}
        options={[
          ["number", "Số đếm"],
          ["time", "Giờ phút"],
          ["date", "Ngày tháng"],
        ]}
      />
      <div className="num-grid section">
        <Converter tab={tab} />
        <Practice tab={tab} />
      </div>
      <div className="section">
        {tab === "number" ? <NumberRef /> : tab === "time" ? <TimeRef /> : <DateRef />}
      </div>
    </>
  );
}
