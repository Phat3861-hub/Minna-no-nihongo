import type { Metadata } from "next";
import { ClientOnly, PageHead } from "@/components/ui";
import VocabStudy from "@/features/vocab/VocabStudy";
import { getKanjiIndex, getVerbGroupMap, getVocabLessons } from "@/lib/data";

export const metadata: Metadata = { title: "Từ vựng" };

export default function Page() {
  const lessons = getVocabLessons();
  const verbGroups = getVerbGroupMap();
  const total = lessons.reduce((s, l) => s + l.words.length, 0);
  return (
    <>
      <PageHead jp="語彙" eyebrow=" · Từ vựng" title="Từ vựng theo bài">
        {total} từ, Bài 1–{lessons.length}. Từ có chữ kanji sẽ hiện từng chữ, âm Hán Việt và chữ đó nằm ở bài nào trong giáo trình Kanji.
      </PageHead>
      <ClientOnly>
        <VocabStudy lessons={lessons} kanjiIndex={getKanjiIndex()} verbGroups={verbGroups} />
      </ClientOnly>
    </>
  );
}
