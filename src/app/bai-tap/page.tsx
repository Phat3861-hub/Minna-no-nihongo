import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly, PageHead } from "@/components/ui";
import ExerciseStudy from "@/features/exercise/ExerciseStudy";
import { getExercises, getGrammarLessons } from "@/lib/data";

export const metadata: Metadata = { title: "Bài tập ngữ pháp" };

export default function Page() {
  const lessons = getGrammarLessons().map((L) => ({ lesson: L.lesson, title: L.title }));
  const qs = getExercises();
  return (
    <>
      <PageHead jp="練習" eyebrow=" · Bài tập" title="Bài tập ngữ pháp">
        {qs.length} câu trắc nghiệm Bài 1–{lessons.length}. Sau mỗi câu có nghĩa của câu và giải thích ngữ pháp. Câu làm đúng được đánh dấu để bạn ưu tiên câu chưa làm đúng.
      </PageHead>
      <ClientOnly>
        <Suspense>
          <ExerciseStudy lessons={lessons} questions={qs} />
        </Suspense>
      </ClientOnly>
    </>
  );
}
