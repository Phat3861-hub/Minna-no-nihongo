import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly, PageHead } from "@/components/ui";
import SearchStudy from "@/features/search/SearchStudy";
import { getKanjiIndex, getVerbData, getVocabLessons } from "@/lib/data";

export const metadata: Metadata = { title: "Tìm từ" };

export default function Page() {
  const lessons = getVocabLessons();
  const verbGroups: Record<string, number> = {};
  for (const v of getVerbData().verbs) verbGroups[v.masu] = v.group;
  return (
    <>
      <PageHead jp="検索" eyebrow=" · Tìm từ" title="Tìm từ vựng">
        Gõ chữ Nhật (kana hoặc kanji), phiên âm romaji hoặc nghĩa tiếng Việt. Ở mọi trang, bạn cũng có thể bấm Ctrl + K (hoặc biểu tượng kính lúp) để tìm nhanh.
      </PageHead>
      <ClientOnly>
        <Suspense>
          <SearchStudy words={lessons.flatMap((l) => l.words)} lessonCount={lessons.length} kanjiIndex={getKanjiIndex()} verbGroups={verbGroups} />
        </Suspense>
      </ClientOnly>
    </>
  );
}
