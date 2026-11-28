# Quản lý route

Next.js tạo URL từ `src/app/`. Thư mục này gom cấu hình để sidebar, tiêu đề và kiểm tra quyền dùng cùng dữ liệu.

- [paths.ts](./paths.ts): URL dùng chung và hàm tạo đường dẫn khóa học.
- [dashboard.ts](./dashboard.ts): title, icon, menu theo role và quyền truy cập.
- [index.ts](./index.ts): export chung; chỉ cần URL thì import `@/route/paths`.

## Luồng truy cập

- `/` luôn chuyển đến `/login`. Route đăng nhập hiện để trống; thành viên Identity triển khai UI.
- Không có landing page hoặc trang Explore. Đường dẫn Explore cũ không còn màn hình và không hiện trong menu.
- Tất cả `/dashboard/*` yêu cầu đăng nhập, kể cả danh sách và chi tiết khóa học.
- Proxy chuyển người thiếu access cookie đến login hoặc khôi phục phiên khi còn refresh cookie, kèm `next` để quay lại trang đang mở.
- Layout dashboard và Course tái sử dụng `AuthenticatedMainLayout` để xác minh phiên ở server. Page riêng vẫn gọi `requireUser(href, route.roles)` trước khi lấy dữ liệu để kiểm tra quyền và giữ đúng URL quay lại. Backend kiểm tra quyền trên dữ liệu.
- AuthProvider giữ thông tin user ở client, không thay thế guard server. Không có sidebar cho khách.
- Dashboard học viên chứa danh sách khóa học; tìm kiếm/phân trang tại `/dashboard?search=...&page=...`.
- Backend vẫn có API public cho dữ liệu khóa học; điều đó không làm trang frontend thành công khai.
- Không tự ghi danh sau login/đăng ký/OTP. Học viên xác nhận ghi danh bằng nút trên trang khóa học.

## Thêm màn hình

Các trang thuộc module Course đặt trong `src/app/(course)/`, không đặt lẫn vào `(dashboard)`. Route group không xuất hiện trong URL:

```text
app/
├── (dashboard)/dashboard/          # Tổng quan và khung trang module khác
└── (course)/
    ├── loading.tsx / error.tsx / not-found.tsx
    └── (workspace)/
        ├── layout.tsx             # Layout chung có header/sidebar và kiểm tra phiên
        └── dashboard/
            ├── courses/
            │   ├── page.tsx       # /dashboard/courses
            │   └── [courseId]/page.tsx
            └── instructor/courses/
                ├── page.tsx       # Quản lý khóa học
                └── new/page.tsx   # Tạo khóa học
```

Editor sau này đặt trong nhóm ngang hàng với `(workspace)` bên trong `(course)`, có layout và kiểm tra phiên riêng để không mang sidebar chính vào editor. Không tạo hai page ở hai nhóm khác nhau cho cùng URL.

Thêm menu vào nhóm `STUDENT`, `INSTRUCTOR` hoặc `ADMIN` trong [dashboard.ts](./dashboard.ts). Sidebar và trang catch-all dùng cùng cấu hình role. Profile/notifications không hiện sidebar nhưng vẫn yêu cầu phiên.

Màn hình riêng tạo `page.tsx` trong `src/app/`; không chỉ dựa vào việc ẩn menu để bảo vệ trang.

```tsx
import { requireUser } from "@/lib/require-user";
import { paths } from "@/route/paths";

await requireUser(paths.course(courseId));
```
