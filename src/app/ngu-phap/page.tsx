import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/ui";
import { getGrammarLessons, getVerbData } from "@/lib/data";

export const metadata: Metadata = { title: "Ngữ pháp" };

export default function Page() {
  const lessons = getGrammarLessons();
  const verbs = getVerbData().verbs;
  const maxVerbLesson = Math.max(...verbs.map((v) => v.lesson));
  const total = lessons.reduce((s, l) => s + l.points.length, 0);
  return (
    <>
      <PageHead jp="文法" eyebrow=" · Ngữ pháp" title="Ngữ pháp theo bài">
        Tóm tắt {total} điểm ngữ pháp Minna no Nihongo sơ cấp I, Bài 1–{lessons.length}. Chọn một bài để xem mẫu câu, giải thích và ví dụ.
      </PageHead>

      <Link href="/ngu-phap/nhom-dong-tu" className="feature new" style={{ marginBottom: 20 }}>
        <span className="fi">動</span>
        <h3>
          Nhóm động từ <span className="badge-new">MỚI</span>
        </h3>
        <p>
          Phân biệt động từ nhóm I, II, III và cách chia thể て, ない, từ điển, た — nền tảng cho ngữ pháp từ Bài 14 trở đi. Có bảng
          {verbs.length} động từ Bài 1–{maxVerbLesson} và bài luyện tập.
        </p>
      </Link>

      <div className="lesson-grid">
        {lessons.map((L) => (
          <Link key={L.lesson} href={`/ngu-phap/bai-${L.lesson}`} className="lesson-card">
            <div className="top">
              <b>Bài {L.lesson}</b>
              <small>{L.points.length} điểm ngữ pháp</small>
            </div>
            <h3>{L.title}</h3>
            <ul>
              {L.points.slice(0, 4).map((p, i) => (
                <li key={i}>{p.pattern}</li>
              ))}
              {L.points.length > 4 && <li>…</li>}
            </ul>
          </Link>
        ))}
      </div>
    </>
  );
}
