# Quản lý route

Next.js vẫn tạo URL từ `src/app/`. Thư mục này gom cấu hình để sidebar, tiêu đề và kiểm tra quyền dùng cùng dữ liệu.

- [paths.ts](./paths.ts): đường dẫn dùng chung và hàm tạo URL có tham số, ví dụ `paths.course(courseId)`.
- [dashboard.ts](./dashboard.ts): title, icon, mô tả, nhóm menu theo role, trang công khai và các trang không hiện trong sidebar.
- [index.ts](./index.ts): export để component import từ `@/route`. Nếu chỉ cần URL, import `@/route/paths` để không kéo thêm icon.

Thêm một mục vào nhóm `STUDENT`, `INSTRUCTOR` hoặc `ADMIN` trong cấu hình dashboard. Sidebar và quyền server của trang catch-all tự lấy cùng cấu hình đó. Trang profile/notifications không có `sidebarRoles` nên không hiện trong sidebar, nhưng vẫn cần đăng nhập. Trang explore có `public: true` nên cho phép khách truy cập.

Màn hình riêng vẫn tạo `page.tsx` trong `src/app/`. Trước khi đọc dữ liệu riêng, gọi `requireUser(href, route.roles)` ở server; lấy route bằng `getDashboardRoute(href)`. Backend tiếp tục kiểm tra quyền trên dữ liệu. Chỉ khai báo route hoặc ẩn menu không tự bảo vệ một page mới.

```tsx
import Link from "next/link";
import { paths } from "@/route/paths";

<Link href={paths.course(course.id)}>{course.title}</Link>;
```

## Xem khóa học trước khi đăng nhập

- `/` chuyển tới `/dashboard/explore`. Explore xác minh phiên ở server: khách được xem, người đã đăng nhập chuyển về `/dashboard`. `ExploreGuestGate` cũng chuyển hướng khi điều hướng trong ứng dụng, sau khi AuthProvider khôi phục phiên từ refresh cookie hoặc nhận phiên từ tab khác.
- Dashboard học viên chứa cả tổng quan Learning và danh sách khóa học công khai, nên tìm kiếm/phân trang của học viên ở `/dashboard?search=...&page=...`, không đi vòng qua explore. Menu explore chỉ hiện cho khách.
- Khách thấy menu Khám phá khóa học, được mở thông tin khóa học đã xuất bản tại `/dashboard/courses/[courseId]`. Proxy dùng `isPublicDashboardPath()` trong `paths.ts` để cho qua đúng hai loại URL này. Các URL nội dung học bên dưới không tự trở thành công khai.
- Trang công khai chỉ gọi API danh sách/thông tin khóa học. Không gọi outline, bài học hay quiz riêng để hiển thị preview.
- Nút ghi danh của khách dẫn tới login kèm `next` quay lại khóa học. Sau đăng nhập, học viên xác nhận ghi danh bằng nút trên trang. API backend vẫn kiểm tra xác thực và role STUDENT.
- Giao diện đăng ký/OTP chưa triển khai. Người phụ trách Identity cần giữ tham số `next` qua các bước đăng ký, OTP và đăng nhập; không tự ghi danh khi xác minh email xong.
