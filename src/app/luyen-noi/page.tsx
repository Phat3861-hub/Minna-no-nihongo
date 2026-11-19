import type { Metadata } from "next";
import { ClientOnly, PageHead } from "@/components/ui";
import SpeakingStudy from "@/features/speaking/SpeakingStudy";
import { getSpeaking } from "@/lib/data";

export const metadata: Metadata = { title: "Luyện nói" };

export default function Page() {
  const data = getSpeaking();
  return (
    <>
      <PageHead jp="会話" eyebrow=" · Luyện nói" title="Luyện nói – câu hỏi vấn đáp">
        Câu hỏi vấn đáp giữa kỳ (Bài 1–12). Mỗi câu có nghĩa, mẫu ngữ pháp cần dùng, câu trả lời mẫu và mẹo. Hãy thay phần thông tin (giờ, ngày, tên, quê…) bằng thông tin thật của bạn.
      </PageHead>
      <ClientOnly>
        <SpeakingStudy data={data} />
      </ClientOnly>
    </>
  );
}
