import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconLeft, IconRight } from "@/components/icons";
import { PageHead } from "@/components/ui";
import GrammarPoint from "@/features/grammar/GrammarPoint";
import LessonLinks from "@/features/grammar/LessonLinks";
import { getExercises, getGrammarLessons } from "@/lib/data";

type Props = { params: Promise<{ bai: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getGrammarLessons().map((L) => ({ bai: `bai-${L.lesson}` }));
}

function find(bai: string) {
  const n = Number(bai.replace(/^bai-/, ""));
  return getGrammarLessons().find((L) => L.lesson === n);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const L = find((await params).bai);
  return { title: L ? `Ngữ pháp Bài ${L.lesson}: ${L.title}` : "Ngữ pháp" };
}

export default async function Page({ params }: Props) {
  const lessons = getGrammarLessons();
  const L = find((await params).bai);
  if (!L) notFound();
  const i = lessons.indexOf(L);
  const prev = lessons[i - 1];
  const next = lessons[i + 1];
  const exCount = getExercises().filter((q) => q.lesson === L.lesson).length;

  return (
    <>
      <PageHead jp="文法" eyebrow={` · Ngữ pháp Bài ${L.lesson}`} title={L.title}>
        {L.points.length} điểm ngữ pháp. {exCount > 0 && <>Học xong hãy làm {exCount} câu bài tập trắc nghiệm của bài này.</>}
      </PageHead>
      <div className="study">
        <aside className="study-side">
          <section className="panel">
            <div className="panel-title">
              <h2>Chọn bài</h2>
            </div>
            <LessonLinks lessons={lessons} current={L.lesson} />
          </section>
          <section className="panel">
            <div className="panel-title">
              <h2>Trong bài này</h2>
            </div>
            <ol className="toc">
              {L.points.map((p, j) => (
                <li key={j}>
                  <a href={`#diem-${j + 1}`}>
                    <span>{j + 1}</span>
                    <span>{p.pattern}</span>
                  </a>
                </li>
              ))}
            </ol>
            {exCount > 0 && (
              <div className="actions">
                <Link href={`/bai-tap?bai=${L.lesson}`} className="btn primary sm" style={{ width: "100%" }}>
                  Làm bài tập Bài {L.lesson}
                </Link>
              </div>
            )}
          </section>
        </aside>
        <div className="study-main">
          {L.points.map((p, j) => (
            <GrammarPoint key={j} p={p} i={j} />
          ))}
          <div className="lesson-nav">
            {prev ? (
              <Link href={`/ngu-phap/bai-${prev.lesson}`} className="btn">
                <IconLeft /> Bài {prev.lesson}
              </Link>
            ) : (
              <span />
            )}
            {exCount > 0 && (
              <Link href={`/bai-tap?bai=${L.lesson}`} className="btn primary">
                Làm bài tập
              </Link>
            )}
            {next ? (
              <Link href={`/ngu-phap/bai-${next.lesson}`} className="btn">
                Bài {next.lesson} <IconRight />
              </Link>
            ) : (
              <Link href="/ngu-phap/nhom-dong-tu" className="btn">
                Nhóm động từ <IconRight />
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
