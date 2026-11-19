/* Danh sách trang hiển thị trên header và menu điện thoại */
export type NavItem = { href: string; label: string; desc: string; icon: string; isNew?: boolean };
export type NavGroup = { label: string; items: NavItem[] };
export type NavEntry = NavItem | NavGroup;

export const NAV: NavEntry[] = [
  { href: "/tu-vung", label: "Từ vựng", desc: "Thẻ ghi nhớ, trắc nghiệm, danh sách", icon: "語" },
  { href: "/kanji", label: "Kanji", desc: "Thẻ, trắc nghiệm, bảng chữ", icon: "字" },
  {
    label: "Ngữ pháp",
    items: [
      { href: "/ngu-phap", label: "Ngữ pháp theo bài", desc: "Mẫu câu, giải thích, ví dụ", icon: "文" },
      { href: "/ngu-phap/nhom-dong-tu", label: "Nhóm động từ", desc: "Nhóm I, II, III và cách chia thể", icon: "動", isNew: true },
      { href: "/bai-tap", label: "Bài tập ngữ pháp", desc: "Trắc nghiệm có giải thích", icon: "問" },
    ],
  },
  { href: "/luyen-noi", label: "Luyện nói", desc: "Câu hỏi vấn đáp, câu trả lời mẫu", icon: "話" },
  { href: "/so-dem", label: "Số – giờ – ngày", desc: "Cách đọc số, giờ, ngày tháng", icon: "数" },
  { href: "/tim-tu", label: "Tìm từ", desc: "Tra kana, kanji, romaji, tiếng Việt", icon: "探" },
];

export const isGroup = (e: NavEntry): e is NavGroup => "items" in e;

export function isActive(pathname: string, href: string) {
  if (href === "/ngu-phap") return pathname === "/ngu-phap" || /^\/ngu-phap\/bai-/.test(pathname);
  return pathname === href || pathname.startsWith(href + "/");
}
