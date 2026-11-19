# Minna no Nihongo I – Ôn tập N5

Trang web ôn tập giáo trình Minna no Nihongo sơ cấp I: từ vựng, kanji, ngữ pháp, nhóm động từ, bài tập, cách đọc số – giờ – ngày tháng và luyện nói.

Xây dựng bằng **Next.js 16 (App Router) + React 19 + TypeScript**. Không dùng database: toàn bộ nội dung nằm trong các file **JSON** ở thư mục `data/`. Tiến độ “đã thuộc” lưu trên trình duyệt (localStorage), giữ nguyên các khóa của bản cũ nên không mất tiến độ đã có.

## Chạy trên máy

Cần Node.js 20.9 trở lên.

```bash
npm install
npm run dev          # mở http://localhost:3000
```

Các lệnh khác:

| Lệnh | Tác dụng |
| --- | --- |
| `npm run build` | Build bản production (giống Vercel) |
| `npm start` | Chạy bản đã build |
| `npm run lint` | Kiểm tra lỗi TypeScript |
| `npm run check-data` | Kiểm tra các file JSON trong `data/` có đúng định dạng không |

## Cấu trúc thư mục

```
data/                       ← NỘI DUNG (sửa ở đây, không cần đụng code)
  vocabulary/bai-01.json …  từ vựng theo bài
  grammar/bai-01.json …     ngữ pháp theo bài
  exercises/bai-01.json …   bài tập trắc nghiệm ngữ pháp theo bài
  kanji/bai-01.json …       kanji theo bài của sách luyện tập Kanji (+ câu trắc nghiệm gạch chân)
  kanji-config.json         chữ dễ nhầm, cách đọc khác cũng đúng (dùng khi tạo đáp án nhiễu)
  verbs.json                nhóm động từ: lý thuyết, quy tắc chia, danh sách động từ
  speaking.json             câu hỏi luyện nói
  romaji-phrases.json       romaji đặc biệt cho một số cụm từ
src/
  app/                      các trang (mỗi thư mục là một đường dẫn)
    page.tsx                Trang chủ               /
    tu-vung/                Từ vựng                 /tu-vung
    kanji/                  Kanji                   /kanji   (mở thẳng một chữ: /kanji?chu=日)
    ngu-phap/               Ngữ pháp                /ngu-phap, /ngu-phap/bai-1 …
    ngu-phap/nhom-dong-tu/  Nhóm động từ            /ngu-phap/nhom-dong-tu
    bai-tap/                Bài tập ngữ pháp        /bai-tap (chọn sẵn bài: /bai-tap?bai=5)
    so-dem/                 Số – giờ – ngày         /so-dem
    tim-tu/                 Tìm từ                  /tim-tu?q=sensei
    luyen-noi/              Luyện nói               /luyen-noi
    globals.css             toàn bộ giao diện + bảng màu (sáng/tối)
  components/               header, menu điện thoại, nút lên đầu trang, tìm nhanh, khung trắc nghiệm…
  features/                 phần tương tác của từng trang
  lib/                      đọc dữ liệu, romaji, cách đọc số, tìm kiếm, tạo câu hỏi, lưu tiến độ
scripts/check-data.mjs      kiểm tra dữ liệu JSON
```

## Thêm / sửa nội dung

Chỉ cần sửa file JSON rồi deploy lại. **Không cần sửa code** khi thêm bài mới: trang web tự đọc mọi file trong thư mục.

### Thêm từ vựng Bài 14

Tạo `data/vocabulary/bai-14.json`:

```json
{
  "lesson": 14,
  "title": "Tên chủ đề bài 14",
  "words": [
    { "kana": "つけます", "kanji": "", "vi": "bật (điện, máy lạnh)" },
    { "kana": "けします", "kanji": "消します", "vi": "tắt", "note": "Ghi chú (không bắt buộc)" }
  ]
}
```

- `kanji`: để `""` nếu từ không có chữ kanji. Nếu có, trang Từ vựng sẽ tự tách từng chữ và cho biết chữ đó thuộc **Kanji Bài mấy** (dựa trên `data/kanji/`).
- Đặt tên file có 2 chữ số (`bai-09`, `bai-14`) để thứ tự luôn đúng.

### Thêm ngữ pháp và bài tập Bài 14

`data/grammar/bai-14.json`:

```json
{
  "lesson": 14,
  "title": "Thể て",
  "points": [
    {
      "pattern": "V て ください",
      "meaning": "Hãy làm V",
      "explanations": ["Dùng để nhờ, yêu cầu người khác làm gì."],
      "examples": [{ "jp": "ここに なまえを かいて ください。", "vi": "Hãy viết tên vào đây." }],
      "note": "Không bắt buộc"
    }
  ]
}
```

`data/exercises/bai-14.json` (`answer` là vị trí đáp án đúng, đếm từ 0; khi làm bài các đáp án được xáo trộn):

```json
{
  "lesson": 14,
  "questions": [
    {
      "question": "まどを（　）ください。",
      "hint": "Gợi ý ngắn (không bắt buộc)",
      "meaning": "Hãy mở cửa sổ.",
      "options": ["あけて", "あけ", "あけます", "あける"],
      "answer": 0,
      "explanation": "V て ください: dùng thể て của động từ."
    }
  ]
}
```

Trang `/ngu-phap/bai-14` sẽ tự được tạo khi build.

### Thêm động từ vào bảng Nhóm động từ

Thêm một dòng vào mảng `verbs` trong `data/verbs.json`:

```json
{ "lesson": 14, "masu": "つけます", "kanji": "", "vi": "bật", "group": 2,
  "forms": { "dict": "つける", "te": "つけて", "nai": "つけない", "ta": "つけた" } }
```

Nếu là ngoại lệ, thêm `"exception": "giải thích ngắn"`.

Sau khi sửa dữ liệu, chạy `npm run check-data` để chắc chắn không sai định dạng.

## Deploy lại lên Vercel

Dự án trước đây là một file `index.html` tĩnh, giờ là ứng dụng Next.js. Vercel hỗ trợ Next.js sẵn, chỉ cần kiểm tra cài đặt project một lần.

### Bước 1 – Đưa code lên nhánh chính

Merge nhánh chứa bản refactor vào nhánh mà Vercel đang deploy (thường là `main`), ví dụ bằng Pull Request trên GitHub. Nếu project Vercel đã nối với repo GitHub, mỗi lần push/merge vào `main` Vercel sẽ tự build lại.

### Bước 2 – Kiểm tra cài đặt Build trên Vercel (chỉ làm một lần)

Vào [vercel.com](https://vercel.com) → chọn project → **Settings** → **Build and Deployment** (một số giao diện ghi là **General → Build & Development Settings**):

| Mục | Giá trị |
| --- | --- |
| **Framework Preset** | `Next.js` (nếu đang là `Other` thì đổi sang Next.js) |
| **Root Directory** | để trống (thư mục gốc của repo) |
| **Build Command** | để mặc định (`next build` / `npm run build`) – tắt nút Override |
| **Output Directory** | để mặc định – **tắt Override** nếu trước đây có đặt (ví dụ `.` hoặc `public`) |
| **Install Command** | để mặc định (`npm install`) |
| **Node.js Version** | `20.x` hoặc `22.x` (mục Settings → General) |

Bấm **Save**.

### Bước 3 – Deploy

- Vào tab **Deployments** → bấm **⋯** ở bản deploy mới nhất → **Redeploy**. Hoặc chỉ cần push/merge code mới vào `main`.
- Đợi trạng thái **Ready**, mở domain cũ để kiểm tra.

> Nếu build lỗi, mở bản deploy đó → **Build Logs** để xem lỗi. Lỗi hay gặp nhất là Output Directory vẫn đang bị override từ thời còn là trang tĩnh – hãy tắt override ở Bước 2.

### Cách khác – Deploy bằng Vercel CLI

```bash
npm i -g vercel
```

```bash
vercel login
```

```bash
vercel --prod
```

Lần đầu CLI sẽ hỏi liên kết với project có sẵn: chọn đúng project cũ để giữ nguyên domain.

### Tiến độ của người học có bị mất không?

Không. Trang mới dùng lại đúng các khóa localStorage cũ (`mnn.done`, `mnn.kdone`, `mnn.edone`, `mnn.sel`…), nên khi mở trên cùng domain và cùng trình duyệt, tiến độ “đã thuộc” vẫn còn.
