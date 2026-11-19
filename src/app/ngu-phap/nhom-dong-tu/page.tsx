import type { Metadata } from "next";
import Link from "next/link";
import { ClientOnly, PageHead } from "@/components/ui";
import VerbPractice from "@/features/verbs/VerbPractice";
import VerbTable from "@/features/verbs/VerbTable";
import { getGrammarLessons, getVerbData } from "@/lib/data";

export const metadata: Metadata = { title: "Nhóm động từ" };

const ROWS = [
  { name: "Hàng い", kana: "い き ぎ し ち に び み り", note: "→ thường là Nhóm I" },
  { name: "Hàng え", kana: "え け げ せ て ね べ め れ", note: "→ thường là Nhóm II" },
];

export default function Page() {
  const d = getVerbData();
  const maxLesson = Math.max(...d.verbs.map((v) => v.lesson));
  const lastGrammar = getGrammarLessons().at(-1)!.lesson;
  return (
    <>
      <PageHead jp="動詞のグループ" eyebrow=" · Ngữ pháp" title="Nhóm động từ">
        Từ Bài 14, nhiều mẫu câu cần chia động từ sang thể て, ない, thể từ điển, thể た. Muốn chia đúng, trước hết phải biết động từ thuộc
        nhóm nào. Trang này tổng hợp cách nhận biết nhóm, cách chia và {d.verbs.length} động từ đã học trong Bài 1–{maxLesson}.
      </PageHead>

      <nav className="panel" aria-label="Mục lục">
        <div className="seg wrap">
          <a href="#nhan-biet" className="btn ghost sm">1. Nhận biết nhóm</a>
          <a href="#bang-dong-tu" className="btn ghost sm">2. Bảng động từ Bài 1–{maxLesson}</a>
          <a href="#cach-chia" className="btn ghost sm">3. Cách chia các thể</a>
          <a href="#luyen-tap" className="btn ghost sm">4. Luyện tập</a>
        </div>
      </nav>

      <h2 className="section-title" id="nhan-biet">1. Cách nhận biết nhóm</h2>
      <div className="callout" style={{ marginBottom: 14 }}>
        <b>Bí quyết:</b> luôn nhìn vào <b>âm đứng ngay trước ます</b> ở thể ます. Ví dụ: か<b>き</b>ます → き thuộc hàng い → Nhóm I; た<b>べ</b>ます → べ thuộc hàng
        え → Nhóm II.
      </div>
      <div className="vg-cards">
        {d.groups.map((g) => (
          <div key={g.group} className={`vg-card g${g.group}`}>
            <span className={`grp g${g.group}`}>{g.name}</span>
            <h3 style={{ marginTop: 6 }}>{g.name}</h3>
            <div className="alias">{g.alias}</div>
            <p>{g.rule}</p>
            <div className="ex">
              {g.examples.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rule-grid section">
        <section className="panel">
          <h3>Bảng âm cần nhớ</h3>
          <div className="table-wrap" style={{ marginTop: 10, border: 0 }}>
            <table className="vt" style={{ minWidth: 0 }}>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.name}>
                    <th style={{ position: "static" }}>{r.name}</th>
                    <td className="jp kana-row">{r.kana}</td>
                    <td className="muted">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <h3>Ngoại lệ nhóm II (cần học thuộc)</h3>
          <p className="cap">{d.exceptionsGroup2.note}</p>
          <div className="vg-card g2" style={{ border: 0, padding: 0 }}>
            <div className="ex">
              {d.exceptionsGroup2.inLessons.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </div>
          <p className="cap" style={{ marginTop: 10 }}>
            Sẽ gặp ở các bài sau: <span className="jp">{d.exceptionsGroup2.later.join("、")}</span>
          </p>
        </section>
      </div>
      <div className="callout section">
        <b>Lưu ý</b>
        <ul>
          {d.tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>

      <h2 className="section-title" id="bang-dong-tu">2. Bảng động từ Bài 1–{maxLesson}</h2>
      <p className="cap">
        Lọc theo nhóm, bật “Che các thể” để tự kiểm tra: đọc thể ます, nói thử thể cần chia rồi bấm vào ô để xem đáp án.
      </p>
      <ClientOnly>
        <VerbTable verbs={d.verbs} />
      </ClientOnly>

      <h2 className="section-title" id="cach-chia">3. Cách chia các thể</h2>
      <p className="cap">Sắp xếp theo thứ tự xuất hiện trong giáo trình. Thể て ở Bài 14 là thể quan trọng nhất cần học trước.</p>
      <div className="rule-grid">
        {d.forms.map((f) => (
          <section key={f.key} className="panel rule-card">
            <h3>
              {f.name} <span className="tag-sm">Bài {f.lesson}</span>
            </h3>
            <p className="use">{f.use}</p>
            {f.rules.map((r) => (
              <div className="rg" key={r.group} style={{ display: "block" }}>
                <span className={`grp g${r.group}`}>{["", "Nhóm I", "Nhóm II", "Nhóm III"][r.group]}</span>
                <ul>
                  {r.items.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>

      <h2 className="section-title" id="luyen-tap">4. Luyện tập</h2>
      <p className="cap">Chọn kiểu câu hỏi: phân loại nhóm hoặc chia sang một thể. Sau mỗi câu có giải thích quy tắc.</p>
      <ClientOnly>
        <VerbPractice verbs={d.verbs} />
      </ClientOnly>

      <div className="lesson-nav">
        <Link href={`/ngu-phap/bai-${lastGrammar}`} className="btn">
          ‹ Ngữ pháp Bài {lastGrammar}
        </Link>
        <Link href="/ngu-phap" className="btn">
          Tất cả bài ngữ pháp
        </Link>
      </div>
    </>
  );
}
