<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Quy tắc làm việc của chủ dự án

- KHÔNG BAO GIỜ tự thêm slogan, câu quảng cáo, lời chào trang trí, nhãn hoặc đoạn mô tả vô nghĩa vào UI, kể cả khi ảnh tham khảo có những nội dung đó.
- Nội dung UI phải phục vụ thao tác, điều hướng, dữ liệu hoặc giải thích lỗi/trạng thái cần thiết. Giữ nhãn form và nhãn hỗ trợ truy cập; bỏ nội dung lặp và các nhãn chỉ để trang trí.
- Ưu tiên tốc độ: thay đổi đúng phạm vi, không tự mở rộng tính năng hay chạy thêm quy trình không cần thiết.
- Chỉ viết, sửa hoặc chạy test khi người dùng yêu cầu rõ ràng. Không tự chạy test qua `npm test`, `npm run check`, coverage hoặc Git hook. Khi commit/push, không để hook tự chạy test nếu chưa được yêu cầu.
