import Link from "next/link";

/** Chọn bài ngữ pháp (mỗi bài là một trang riêng) */
export default function LessonLinks({ lessons, current }: { lessons: { lesson: number; title: string; points: unknown[] }[]; current?: number }) {
  return (
    <div className="chips scroll-sm" role="navigation" aria-label="Chọn bài ngữ pháp">
      {lessons.map((L) => (
        <Link
          key={L.lesson}
          href={`/ngu-phap/bai-${L.lesson}`}
          className="chip"
          aria-pressed={L.lesson === current}
          aria-current={L.lesson === current ? "page" : undefined}
          title={L.title}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <span className="n">Bài {L.lesson}</span>
          <span className="c">{L.points.length} điểm</span>
        </Link>
      ))}
      <Link href="/ngu-phap/nhom-dong-tu" className="chip" title="Nhóm động từ" style={{ textDecoration: "none", color: "inherit", gridColumn: "span 2" }}>
        <span className="n">Nhóm động từ</span>
        <span className="c">nhóm I, II, III</span>
      </Link>
    </div>
  );
}
