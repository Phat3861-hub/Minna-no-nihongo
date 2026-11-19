import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly, PageHead } from "@/components/ui";
import KanjiStudy, { type VocabUse } from "@/features/kanji/KanjiStudy";
import { getKanjiData, getVocabLessons } from "@/lib/data";
import { kanjiChars } from "@/lib/utils";

export const metadata: Metadata = { title: "Kanji" };

export default function Page() {
  const data = getKanjiData();
  const known = new Set(data.groups.flatMap((g) => g.items.map((k) => k.char)));
  // Chữ kanji → các từ vựng Minna có chứa chữ đó
  const uses: Record<string, VocabUse[]> = {};
  for (const L of getVocabLessons())
    for (const w of L.words)
      for (const c of kanjiChars(w.kanji))
        if (known.has(c)) (uses[c] ??= []).push({ kanji: w.kanji, kana: w.kana, vi: w.vi, lesson: w.lesson });
  const total = known.size;
  return (
    <>
      <PageHead jp="漢字" eyebrow=" · Kanji" title="Kanji theo sách luyện tập">
        {total} chữ theo thứ tự sách luyện tập Kanji Minna no Nihongo sơ cấp I, kèm âm Hán Việt, âm On/Kun, từ ví dụ và các từ vựng trong bài học có dùng chữ đó.
      </PageHead>
      <ClientOnly>
        <Suspense>
          <KanjiStudy data={data} uses={uses} />
        </Suspense>
      </ClientOnly>
    </>
  );
}
