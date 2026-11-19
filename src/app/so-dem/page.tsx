import type { Metadata } from "next";
import { ClientOnly, PageHead } from "@/components/ui";
import NumbersStudy from "@/features/numbers/NumbersStudy";

export const metadata: Metadata = { title: "Số – giờ – ngày" };

export default function Page() {
  return (
    <>
      <PageHead jp="数字" eyebrow=" · Số – giờ – ngày" title="Cách đọc số, giờ, ngày tháng">
        Nhập số, giờ hoặc ngày để xem cách đọc, luyện đọc ngẫu nhiên và xem bảng các cách đọc đặc biệt cần học thuộc.
      </PageHead>
      <ClientOnly>
        <NumbersStudy />
      </ClientOnly>
    </>
  );
}
