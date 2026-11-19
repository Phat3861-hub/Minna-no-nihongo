import Link from "next/link";
import FeatureGrid from "@/features/home/FeatureGrid";
import { getExercises, getGrammarLessons, getKanjiData, getSpeaking, getVerbData, getVocabLessons } from "@/lib/data";

export default function Home() {
  const vocab = getVocabLessons();
  const words = vocab.reduce((s, l) => s + l.words.length, 0);
  const kanji = getKanjiData().groups.reduce((s, g) => s + g.items.length, 0);
  const grammar = getGrammarLessons();
  const points = grammar.reduce((s, l) => s + l.points.length, 0);
  const ex = getExercises().length;
  const speak = getSpeaking().sections.reduce((s, x) => s + x.items.length, 0);
  const verbs = getVerbData().verbs.length;

  return (
    <>
      <section className="hero">
        <div>
          <span className="page-head" style={{ margin: 0 }}>
            <span className="eyebrow">
              <span className="jp">みんなの日本語 I</span> · N5 · Bài 1–{vocab.length}
            </span>
          </span>
          <h1>
            Ôn tập <em>Minna no Nihongo</em> mỗi ngày, gọn trong một trang.
          </h1>
          <p className="lede">
            Thẻ ghi nhớ và trắc nghiệm từ vựng, kanji kèm âm Hán Việt, ngữ pháp từng bài, nhóm động từ, bài tập có giải thích và luyện nói cho bài thi vấn đáp.
          </p>
          <div className="actions" style={{ marginTop: 0 }}>
            <Link href="/tu-vung" className="btn primary">
              Bắt đầu học từ vựng
            </Link>
            <Link href="/ngu-phap/nhom-dong-tu" className="btn">
              Xem nhóm động từ
            </Link>
          </div>
          <div className="stats">
            <div>
              <b>{words}</b>
              <span>từ vựng</span>
            </div>
            <div>
              <b>{kanji}</b>
              <span>chữ kanji</span>
            </div>
            <div>
              <b>{points}</b>
              <span>điểm ngữ pháp</span>
            </div>
            <div>
              <b>{ex}</b>
              <span>câu bài tập</span>
            </div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          {"日本語学生先週会社電車食飲行来見".split("").map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      </section>

      <h2 className="section-title">Bạn muốn học gì hôm nay?</h2>
      <FeatureGrid
        items={[
          { href: "/tu-vung", icon: "語", title: "Từ vựng", desc: "Thẻ ghi nhớ, trắc nghiệm hai chiều, danh sách theo bài. Mỗi từ có kanji đều chỉ rõ chữ đó học ở Bài mấy.", progress: { kind: "vocab", total: words, unit: "từ đã thuộc" } },
          { href: "/kanji", icon: "字", title: "Kanji", desc: "Âm Hán Việt, On/Kun, từ ví dụ, 6 kiểu trắc nghiệm và bảng chữ.", progress: { kind: "kanji", total: kanji, unit: "chữ đã thuộc" } },
          { href: "/ngu-phap", icon: "文", title: "Ngữ pháp", desc: `${points} mẫu câu Bài 1–${grammar.length} với giải thích và ví dụ.` },
          { href: "/ngu-phap/nhom-dong-tu", icon: "動", title: "Nhóm động từ", isNew: true, desc: `Nhóm I, II, III, cách chia thể て/ない/từ điển/た và ${verbs} động từ Bài 1–13.` },
          { href: "/bai-tap", icon: "問", title: "Bài tập ngữ pháp", desc: "Trắc nghiệm có nghĩa câu và giải thích sau mỗi câu.", progress: { kind: "exercise", total: ex, unit: "câu đã làm đúng" } },
          { href: "/luyen-noi", icon: "話", title: "Luyện nói", desc: `${speak} câu hỏi vấn đáp kèm câu trả lời mẫu, furigana và nghe đọc.` },
          { href: "/so-dem", icon: "数", title: "Số – giờ – ngày", desc: "Đổi số, giờ, ngày sang cách đọc và luyện đọc ngẫu nhiên." },
          { href: "/tim-tu", icon: "探", title: "Tìm từ", desc: "Tra theo kana, kanji, romaji hoặc tiếng Việt. Ở mọi trang bấm Ctrl + K." },
        ]}
      />
    </>
  );
}
