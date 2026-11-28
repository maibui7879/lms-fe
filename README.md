# LMS Frontend — Hướng dẫn công việc

Tài liệu chia việc cho **4 thành viên, mỗi người phụ trách một module như backend và làm trên một nhánh**: Identity, Course, Quiz, Learning. Người phụ trách làm đầy đủ màn hình, API/service frontend, component và test của module đó. Tên component và đường dẫn chưa có được ghi là **cần tạo**, không phải code đã làm xong.

## 1. Đọc gì trước khi làm?

| Nguồn                                                                                                                               | Cần đọc gì?                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Đề bài `DeTai_BTL_CuoiKy_LTWNC_v2.pdf` do nhóm cung cấp                                                                             | Mục 2: yêu cầu chung; Đề 2: LMS; mục 5: sản phẩm nộp                |
| [UI Figma](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=68-2)                                               | Màn hình thuộc phần mình làm, bố cục, màu, font và ghi chú cạnh màn |
| [Backend](https://github.com/maibui7879/lms-backend)                                                                                | README của service, controller, kiểu dữ liệu nhận/trả về            |
| [Các API Gateway đang mở](https://github.com/maibui7879/lms-backend/blob/main/apps/api-gateway/src/routing/implemented-routes.json) | API mình cần đã gọi được qua Gateway chưa                           |
| [Quy định API](https://github.com/maibui7879/lms-backend/blob/main/packages/contracts/README.md)                                    | Token, phân trang, lỗi và số phiên bản khi sửa dữ liệu              |

Nhóm dùng **Next.js + NestJS**, tương ứng kiến trúc C trong đề. Frontend gọi Gateway; backend lưu dữ liệu, kiểm tra quyền và chấm quiz.

### Chạy phần đăng nhập

- Sao chép `.env.example` thành `.env.local`, đặt `API_GATEWAY_URL` trỏ tới Gateway đang chạy. Browser gọi `/api/auth/*` và `/api/gateway/*` của Next.js; Next.js mới gửi Bearer token tới backend.
- Access token và refresh token nằm trong cookie HttpOnly. Không đưa token vào Zustand, localStorage hoặc props gửi xuống browser. Component dùng `useAuth()`; Server Component dùng `requireUser()` trước khi đọc dữ liệu riêng.
- Bản hiện tại dùng bộ nhớ của **một Node process** để gộp refresh và chặn phiên đã logout. Production phải đặt `AUTH_SESSION_MODE=single-instance`, chạy một process lâu dài bằng `next start` và HTTPS. Không dùng cấu hình này cho serverless, nhiều replica, nhiều worker hoặc PM2 cluster. Cần bộ phối hợp dùng chung trước khi triển khai theo các cách đó; chưa có Redis coordinator trong bản này. Thiếu cấu hình production thì API phiên trả 503.
- Logout chờ refresh đang chạy rồi thu hồi token mới nhất ở backend. Nếu backend không liên lạc được, browser vẫn được xóa cookie và hiển thị lỗi thu hồi phiên. Access JWT đã được sao chép ra ngoài vẫn tuân theo thời hạn và quy tắc thu hồi của backend; frontend không thay đổi quy tắc đó.
- Body đăng nhập tối đa **16 KiB**, body qua proxy tối đa **2 MiB**, tính cả khi không có `Content-Length`. File lớn cần route upload riêng hoặc upload trực tiếp theo API backend. Giới hạn thêm connection, thời gian đọc và số request ở reverse proxy khi deploy.

Hiện frontend có khung trang và các hàm gọi API. Các thành viên triển khai màn hình theo phần việc bên dưới; phần Quiz dùng kiểu dữ liệu và API trong contract của backend.

## 2. Chia việc theo nhánh

Điền tên người nhận trước khi bắt đầu. Giữ các tên nhánh hiện có, không cần đổi nhánh theo tên module:

| Thành viên | Nhánh                             | Công việc chính                                                                                                                               |
| ---------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Linh       | `feat/auth/login`                 | **Identity:** đăng ký/đăng nhập, phiên, hồ sơ, yêu cầu giảng viên, Admin quản lý người dùng/role                                              |
| Mạnh       | `feat/courses/catalog-enrollment` | **Course:** danh mục, nội dung khóa/chương/bài, ghi danh, hỏi đáp, dashboard quản lý khóa, Admin duyệt khóa và thống kê ghi danh              |
| Khánh      | `feat/quizzes/quiz-player`        | **Quiz:** soạn quiz/câu hỏi, lượt làm, lưu đáp án, nộp bài, điểm/kết quả từng lượt và thống kê câu hỏi                                        |
| Hưng       | `feat/learning/progress`          | **Learning:** trang học ghép nội dung Course, tiến độ, hoàn thành, học tiếp, dashboard học tập, báo cáo tiến độ/điểm tổng hợp, CSV, chứng chỉ |

`main` nhận phần đã kiểm tra qua pull request. Nhánh `feat/shared/gateway-api-client` đã có dành cho sửa phần gọi API chung khi cần, **không tính là người thứ năm**. TV1 làm đầu mối phần chung; thay đổi chung merge vào `main` rồi các thành viên lấy về.

### Quy tắc chia việc giữa các module

- Chia theo dữ liệu/chức năng backend, không chia theo vai trò Student/Teacher/Admin. Ví dụ Admin quản lý user thuộc Identity, Admin duyệt course thuộc Course, giảng viên soạn câu hỏi thuộc Quiz.
- Mỗi người viết API/service/component/test của module mình. Màn hình cần chức năng module khác thì gọi service hoặc ghép component người đó cung cấp; không viết lại phần của họ.
- Course sở hữu nội dung và hỏi đáp; Learning sở hữu tiến độ và vị trí học tiếp. Quiz sở hữu điểm từng lượt; Learning hiển thị điểm tổng hợp từ API Learning, không chấm lại bài.
- Một trang có thể ghép nhiều module nhưng chỉ có một người phụ trách file page. Bảng dưới chốt phần ai làm và ai chỉ ghép lại.

| Phần giao nhau                                           | Người làm chính | Người sử dụng                                       |
| -------------------------------------------------------- | --------------- | --------------------------------------------------- |
| Phiên và kiểm tra đăng nhập                              | TV1             | Cả nhóm dùng hàm/hook chung                         |
| Nội dung video/Markdown, cây chương/bài                  | TV2             | TV4 ghép vào trang học                              |
| Hỏi đáp và trả lời                                       | TV2             | TV4 ghép dưới bài; TV2 dùng trên dashboard khóa học |
| Soạn quiz và trình làm quiz                              | TV3             | TV2 ghép vào giáo trình; TV4 mở từ trang học        |
| Thanh tiến độ, nút hoàn thành/học tiếp, báo cáo Learning | TV4             | TV2 ghép số liệu phù hợp trên dashboard giảng viên  |
| Số liệu ghi danh của Course                              | TV2             | Trang quản lý khóa và Admin thống kê ghi danh       |

Phần hạ tầng chung làm một lần: TV1 dựng phiên, provider và khung header/sidebar; cả nhóm tái dùng. Notification là service hỗ trợ riêng của backend, không thuộc Identity: giao TV1 làm thêm chuông/trang thông báo qua feature notifications sẵn có, giữ API/service tách riêng. Mỗi người vẫn tự làm test cho module của mình; TV1 chỉ cấu hình công cụ kiểm tra chung.

## 3. Cài đặt và chạy

Dùng Node.js 24. Chạy trong thư mục frontend:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Linux/macOS thay `Copy-Item` bằng `cp`. PowerShell chặn `npm.ps1` thì dùng `npm.cmd`.

Theo [env mẫu](./.env.example):

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:5173
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Mở `http://localhost:5173`. API URL là địa chỉ Gateway, không thêm `/api/v1` vì code đã có phần đó. Không đặt token/khóa riêng vào biến `NEXT_PUBLIC_*`.

Frontend cố định cổng **5173** cho cả `npm run dev` và `npm run start` (chạy `npm run build` trước khi start). Các cổng **3000–3005** dành cho backend. Nếu 5173 đã được dùng, lệnh sẽ báo lỗi để xử lý process đang chiếm cổng, không tự chuyển sang cổng backend.

Backend chạy ở repo riêng theo [Gateway README](https://github.com/maibui7879/lms-backend/blob/main/apps/api-gateway/README.md) và README từng service. Port dev: Gateway 3000, Identity 3001, Course 3002, Quiz 3003, Learning 3004, Notification 3005. Cấu hình DB/env, public key khớp Identity, `GATEWAY_ALLOWED_ORIGINS` có `http://localhost:5173`.

Swagger: `http://localhost:3000/docs`; health Gateway: `http://localhost:3000/health`. Gateway chạy không có nghĩa tất cả service/DB đã chạy. Tài khoản demo và seed cần chuẩn bị cùng backend; hiện chưa có tài khoản demo được kiểm chứng trong README.

## 4. Code ở đâu, dùng công nghệ gì?

### Đọc code frontend theo thứ tự

| File/thư mục                               | Dùng để làm gì?                                                |
| ------------------------------------------ | -------------------------------------------------------------- |
| [package.json](./package.json)             | Thư viện đã cài và lệnh chạy                                   |
| [src/app/](./src/app/)                     | Đường dẫn trang, layout, đang tải/lỗi/404                      |
| [src/route/](./src/route/)                 | Cấu hình đường dẫn, title, icon, sidebar và role của dashboard |
| [src/features/](./src/features/)           | API theo phần: auth, users, courses, learning, notifications   |
| [src/services/](./src/services/)           | Hàm màn hình sẽ gọi, ví dụ đăng nhập/lấy khóa học              |
| [API client](./src/lib/api-client.ts)      | Gửi request, token, query và đọc lỗi                           |
| [Types](./src/lib/types.ts)                | Kiểu dữ liệu dùng chung                                        |
| [Auth store](./src/store/auth-store.ts)    | Phiên đăng nhập; hiện chỉ nằm trong bộ nhớ                     |
| [useDebounce](./src/hooks/use-debounce.ts) | Chờ ngừng gõ rồi mới tìm kiếm/gửi thay đổi                     |

Luồng dữ liệu: **component → service → feature API → API client → Gateway → backend**.

```ts
import { courseService } from "@/services/course.service";

const page = await courseService.listCourses({ page: 1, limit: 12 });
// Service đã lấy phần data. Danh sách nằm ở page.items.
```

Không viết lại fetch/URL trong từng component. Backend thường trả `{ data, meta }`; service lấy `.data` một lần. Response 204 không có dữ liệu; PDF trả Blob. Đọc `ApiClientError.status`/`code` để hiển thị lỗi, giữ requestId để tra lỗi cùng backend.

### Công nghệ dùng cho từng việc

| Việc                         | Dùng gì?                                                                              | Hiện trạng                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Trang và điều hướng          | Next.js App Router, TypeScript strict                                                 | Đã có                                                          |
| CSS/icon                     | Tailwind CSS, lucide-react, clsx/tailwind-merge                                       | Đã cài                                                         |
| Form/validation              | React Hook Form + Zod + zodResolver                                                   | Đã cài, cần tạo form                                           |
| Dữ liệu API, tải lại sau sửa | TanStack Query                                                                        | Đã cài; TV1 tạo QueryClientProvider chung                      |
| Phiên và bài quiz đang làm   | Zustand; persist cho bản nháp quiz                                                    | Zustand                                                        |
| Theme ít thay đổi            | React Context                                                                         | TV1 tạo ThemeContext/ThemeProvider theo yêu cầu đề             |
| Kéo thả chương/bài           | [dnd-kit](https://dndkit.com/react/hooks/use-sortable/)                               | Đề xuất cho TV2, chưa cài; thống nhất phiên bản trước khi dùng |
| Markdown                     | [react-markdown](https://github.com/remarkjs/react-markdown), remark-gfm nếu cần bảng | TV2 tạo component nội dung; TV4 ghép vào trang học; chưa cài   |
| Test                         | Vitest + React Testing Library + user-event                                           | Đã cài; coverage chưa cấu hình                                 |

Chỉ thêm thư viện cần dùng, cập nhật lockfile và báo nhóm. Không cần thêm Redux vì đã dùng Zustand.

### Chia component thế nào?

Component nhỏ dùng chung đặt ở `src/components/ui/`. Header/sidebar đặt ở `src/components/layout/`. Component riêng để trong feature tương ứng. **Các thư mục component này cần tạo**, hiện chưa có bộ UI dùng sẵn.

Ví dụ phần Course cần tạo thêm:

```text
src/features/courses/
  api.ts                    # Đã có: đường dẫn và request
  types.ts                  # Kiểu riêng nếu cần
  components/
    course-card.tsx
    course-form.tsx
    curriculum-builder.tsx
  hooks/
    use-instructor-courses.ts
  schemas/
    course-form.schema.ts
```

- Page ghép các component; không đặt toàn bộ form/bảng/API/hộp thoại vào một file dài.
- Component nhận dữ liệu/hàm xử lý qua props có kiểu. `CourseCard` nhận course và các nút phù hợp; không copy hai card gần giống nhau cho học viên/giảng viên.
- Dùng chung Button, Field, Dialog, Tabs, Pagination, StatusBadge, EmptyState, ErrorState. Đây là tên đề xuất cần tạo, không phải component import được ngay.
- Dialog dùng được bằng bàn phím và trả focus về nút mở. Form phải có nhãn và lỗi rõ ràng; trạng thái không chỉ thể hiện bằng màu.
- Page/layout mặc định ở server; form, sự kiện bấm, Zustand/React Query cần `"use client"`. Giữ page có metadata ở server và tách phần tương tác thành component con. Server không đọc được Zustand trình duyệt.

## 5. TV1 — Module Identity

**Nhánh:** `feat/auth/login`.

### Cần đọc

- Frontend: [login page](<./src/app/(auth)/login/page.tsx>), [auth API](./src/features/auth/api.ts), [auth service](./src/services/auth.service.ts), [auth store](./src/store/auth-store.ts), [users API](./src/features/users/api.ts), [user service](./src/services/user.service.ts).
- Phần chung: [root layout](./src/app/layout.tsx), [dashboard layout](<./src/app/(dashboard)/dashboard/layout.tsx>), [notification API](./src/features/notifications/api.ts), [notification service](./src/services/notification.service.ts).
- Backend: [Identity README](https://github.com/maibui7879/lms-backend/blob/main/services/identity-service/README.md), [Auth controller](https://github.com/maibui7879/lms-backend/blob/main/services/identity-service/src/modules/auth/auth.controller.ts), [Users controller](https://github.com/maibui7879/lms-backend/blob/main/services/identity-service/src/modules/users/users.controller.ts), [Admin Users controller](https://github.com/maibui7879/lms-backend/blob/main/services/identity-service/src/modules/users/admin-users.controller.ts).

### Màn hình và component

| Màn hình                                                                                                                                                                                                  | Component cần tạo/ghép                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Đăng nhập/đăng ký/OTP/quên và đặt lại mật khẩu                                                                                                                                                            | AuthLayout, LoginForm, RegisterForm, OtpForm, PasswordResetForm |
| [Hồ sơ cá nhân](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=68-1564)                                                                                                             | ProfileForm, PasswordForm                                       |
| [Xin làm giảng viên](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=70-564), [theo dõi yêu cầu](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=70-867)        | TeacherRequestForm, RequestStatus                               |
| [Admin duyệt giảng viên](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=70-1181), [hộp duyệt/từ chối](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=70-2425) | RequestTable, RequestDetail, ConfirmDialog                      |
| [Admin quản lý tài khoản/role](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=71-6774)                                                                                              | UserTable, RoleDialog, AccountStatusDialog                      |
| Thông báo theo ghi chú Figma                                                                                                                                                                              | NotificationList, NotificationItem, UnreadBadge                 |
| Khung chung theo ảnh Teacher Dashboard                                                                                                                                                                    | AppHeader, AppSidebar, MobileNav, UserMenu, NotificationBell    |

### Thứ tự làm

1. Login/refresh đã đọc `{ data, meta }` ở Route Handler Next.js. Token được đặt vào cookie HttpOnly; frontend chỉ nhận `{ user }`. TV1 tiếp tục đăng ký/OTP/quên mật khẩu trên nền phiên này, không đưa token trở lại store hoặc storage.
2. Làm đăng nhập → đăng ký/OTP → quên mật khẩu. Dùng React Hook Form/Zod; hiển thị lỗi backend, khóa nút khi đang gửi. Validation theo DTO thực tế, không tự đoán độ dài mật khẩu.
3. `/` chuyển đến `/login`. Toàn bộ `/dashboard/*`, kể cả danh sách và chi tiết khóa học, yêu cầu đăng nhập. Không có landing page hoặc Explore công khai. Proxy điều hướng khi thiếu cookie; layout và page xác minh phiên bằng requireUser trước khi lấy dữ liệu. Sidebar chỉ điều khiển hiển thị; backend vẫn kiểm tra quyền. Route `/login` hiện để trống, UI do người phụ trách Identity triển khai.
4. Làm hồ sơ, yêu cầu giảng viên và Admin duyệt/đổi role/khóa tài khoản. Tự đăng ký chỉ tạo học viên. Logout phải xóa phiên/cache cả khi request backend thất bại; refresh bị từ chối thì yêu cầu login lại.
5. Làm header/sidebar theo ảnh, menu dựa vào quyền thật, thu gọn trên điện thoại. Các nhãn Student/Admin/Teacher không được tự cấp quyền cho tài khoản.
6. Tạo QueryClientProvider, ThemeContext và UI chung. Thống nhất props với nhóm. Thêm `usePaginatedQuery<TItem>` cho danh sách API có phân trang; giữ [useDebounce<T>](./src/hooks/use-debounce.ts) làm hook generic thứ nhất. Cả hai cần test.
7. Thông báo có Tất cả/Chưa đọc, số chưa đọc, phân trang, đánh dấu từng mục. Chưa thêm đọc tất cả/xóa vì backend chưa hỗ trợ. Nếu nối Socket.IO, cần cài client, đi qua Gateway, chống mục trùng và tải lại sau kết nối lại.

**API:** `/api/v1/auth/*`, `/api/v1/users/me*`, `/api/v1/admin/users*`, `/api/v1/notifications*`; xem method/body trong code và Swagger.

**Tự kiểm tra:** login đúng/sai, OTP sai, token hết hạn, logout lỗi, học viên vào URL Admin bị chặn, đổi tài khoản không thấy cache người trước. Bàn giao danh sách component chung và ví dụ props cho nhóm.

## 6. TV2 — Module Course

**Nhánh:** `feat/courses/catalog-enrollment`.

### Cần đọc

- Frontend: [course API](./src/features/courses/api.ts), [course service](./src/services/course.service.ts), [types](./src/lib/types.ts), [course page](<./src/app/(course)/(workspace)/dashboard/courses/[courseId]/page.tsx>), [useDebounce](./src/hooks/use-debounce.ts).
- Backend: [Course README](https://github.com/maibui7879/lms-backend/blob/main/services/course-service/README.md), [Course DTO](https://github.com/maibui7879/lms-backend/blob/main/packages/contracts/src/http/course.ts), [Courses controller](https://github.com/maibui7879/lms-backend/blob/main/services/course-service/src/modules/courses/courses.controller.ts), [Enrollment controller](https://github.com/maibui7879/lms-backend/blob/main/services/course-service/src/modules/enrollments/enrollments.controller.ts), [Review controller](https://github.com/maibui7879/lms-backend/blob/main/services/course-service/src/modules/course-revisions/course-revisions.controller.ts).

### Màn hình và component

| Màn hình                                                                                                                                                                                      | Component cần tạo/ghép                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Danh mục khóa học sau đăng nhập, chi tiết, ghi danh                                                                                                                                           | CourseCard, CourseFilters, CourseDetail, EnrollButton                     |
| [Teacher Dashboard](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=70-1817), theo ảnh nhóm gửi                                                                          | TeacherSummary, CourseStatusTabs, InstructorCourseCard, RecentDiscussions |
| [Giảng viên quản lý khóa học](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=70-2794)                                                                                   | InstructorCourseList, StatusBadge, Pagination                             |
| [Tạo/sửa khóa học](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=70-3350)                                                                                              | CourseForm, CourseSettings                                                |
| [Soạn chương/bài](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=71-7318), [panel sửa nhanh](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=97-2) | CurriculumBuilder, ChapterRow, LessonRow, LearningItemForm, EditDrawer    |
| Admin: hàng đợi khóa học, xem trước, duyệt/từ chối                                                                                                                                            | ReviewQueue, CoursePreview, ReviewDialog                                  |
| Hỏi đáp theo khóa/bài, trả lời và quản lý câu hỏi                                                                                                                                             | DiscussionList, DiscussionItem, ReplyForm                                 |
| Nội dung học dùng trong trang học TV4                                                                                                                                                         | VideoPlayer, MarkdownContent, CurriculumSidebar; TV2 làm, TV4 ghép        |
| Admin thống kê ghi danh                                                                                                                                                                       | EnrollmentStats theo dữ liệu Course                                       |

Danh mục khóa học và Admin duyệt khóa học dùng layout/component chung. Quyết định hiện tại của dự án là yêu cầu đăng nhập để vào app; không triển khai landing page hoặc xem khóa học khi chưa đăng nhập.

### Thứ tự làm

1. Catalog có tìm kiếm/lọc/phân trang trong dashboard sau đăng nhập. Chi tiết ở `/dashboard/courses/[courseId]` cũng yêu cầu phiên hợp lệ. Không tạo route catalog/chi tiết công khai. Nếu cache dữ liệu khóa học từ API public, vẫn xác minh phiên trước khi hiển thị trang và không cache dữ liệu cá nhân dùng chung.
2. Làm chi tiết/ghi danh. Chưa login thì chuyển login rồi quay lại khóa học. Backend lấy người ghi danh từ JWT, không gửi userId tùy chọn từ UI.
3. Teacher Dashboard/My Courses dùng `listInstructorCourses`. Nút thống kê sang màn TV4, nút soạn bài sang màn TV2. Dùng header/sidebar TV1, không tạo layout giống hệt lần nữa.
4. Làm tạo/sửa khóa, rồi chương → bài → nội dung. Backend lưu **Course → Chapter → Lesson → LearningItem**; VIDEO/READING/QUIZ nằm ở LearningItem. Không gắn video trực tiếp lên Lesson vì UI gọi chung là bài.
5. Kéo thả chương/bài bằng dnd-kit, có cách dùng bàn phím. Gửi đủ thứ tự và version theo API; request lỗi thì trả về thứ tự cũ, báo cho người dùng.
6. Làm gửi duyệt, hàng đợi Admin, duyệt/từ chối có lý do. Hiện DRAFT/IN_REVIEW/PUBLISHED/REJECTED theo server. Gửi version cũ bị 409 thì đọc lại và báo xung đột, không âm thầm ghi đè.
7. Màn soạn giáo trình ghép component quiz TV3 cung cấp; thống nhất props courseId/lessonId và vị trí quiz trước khi ghép.
8. Phụ trách toàn bộ phần hỏi đáp: hàm API/service, màn hỏi đáp theo khóa/bài và các component DiscussionList, DiscussionItem, ReplyForm trong feature Course. Đọc [Discussion controller](https://github.com/maibui7879/lms-backend/blob/main/services/course-service/src/modules/discussions/discussions.controller.ts) và [Discussion service](https://github.com/maibui7879/lms-backend/blob/main/services/course-service/src/modules/discussions/discussions.service.ts). Tạo câu hỏi với courseId/lessonId; trả lời gửi parentId và lessonId khớp câu gốc. API list hiện phân trang theo khóa, chưa lọc theo bài; phối hợp backend bổ sung lọc lesson để không bỏ sót câu hỏi. Dashboard giảng viên dùng lại component theo khóa được chọn, không mặc định có API gom hỏi đáp mọi khóa. Bàn giao component nhận courseId/lessonId cho TV4 ghép vào trang học; TV4 không viết lại API/service hỏi đáp.
9. Tạo VideoPlayer, MarkdownContent và CurriculumSidebar trong feature Course từ nội dung/outline backend trả. Component chỉ hiển thị nội dung, nhận callback khi cần báo vị trí phát; không tự cập nhật tiến độ Learning. Bàn giao props cho TV4 ghép trang học.
10. Làm màn Admin thống kê ghi danh từ dữ liệu Course được phép đọc. Nếu cần số tổng/bộ lọc chưa có thì phối hợp backend Course bổ sung, không đếm trang đầu thành tổng. Phân biệt số người và số lượt ghi danh.

**API:** course list/detail/create/update/delete, `/instructor/courses`, chapters/lessons/items/order, submit-review/review, enrollments. Hàm cơ bản đã có; giáo trình/duyệt cần thêm theo controller.

### Đọc ảnh Teacher Dashboard thế nào?

| Phần trong ảnh                        | Cách làm                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Tổng khóa, nháp/chờ duyệt/đã xuất bản | Tính từ dữ liệu đầy đủ; số tổng không được chỉ đếm trang đầu                                                             |
| Tổng học viên                         | TV4 cung cấp dữ liệu. Tổng lượt ghi danh khác số người không trùng, phải ghi đúng nhãn                                   |
| Hỏi đáp theo khóa, trả lời ngay       | TV2 làm API/service và component hỏi đáp; dùng lại trên dashboard theo khóa được chọn và bàn giao cho TV4 ghép trang học |
| Student/Admin/Teacher                 | Chỉ đổi khu vực được tài khoản cho phép xem, không tạo quyền mới                                                         |

**Tự kiểm tra:** danh sách rỗng/lọc/phân trang, ghi danh, 404/403, giảng viên không sửa khóa người khác, kéo thả lỗi, version cũ, Admin duyệt/từ chối, catalog cập nhật sau duyệt, hỏi đáp sai quyền, trả lời đúng câu gốc, nội dung video/Markdown hiển thị đúng và thống kê ghi danh đủ dữ liệu.

## 7. TV3 — Module Quiz

**Nhánh:** `feat/quizzes/quiz-player`.

### Cần đọc

- Frontend: [API client](./src/lib/api-client.ts), [types](./src/lib/types.ts), [auth store](./src/store/auth-store.ts), [client tests](./src/lib/api-client.test.ts). Cần tạo feature Quiz và quiz service.
- Backend: [Quiz README](https://github.com/maibui7879/lms-backend/blob/main/services/quiz-service/README.md), [Quiz DTO](https://github.com/maibui7879/lms-backend/blob/main/packages/contracts/src/http/quiz.ts), [Result V2](https://github.com/maibui7879/lms-backend/blob/main/packages/contracts/src/http/quiz-result.ts), [Quiz OpenAPI](https://github.com/maibui7879/lms-backend/blob/main/packages/contracts/openapi/quiz.json).

### Màn hình và component

| Màn hình                                                                                                                     | Component cần tạo/ghép                                        |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [Tạo quiz](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=100-1602), danh sách quiz/câu hỏi giảng viên | QuizForm, QuizList, QuestionEditor, ChoiceEditor              |
| [Làm quiz có giờ](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=68-1303)                              | Quiz, Quiz.Question, Quiz.Timer, Quiz.Navigation, Quiz.Submit |
| [Kết quả/xem lại từng lượt](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=100-8)                      | QuizResult, AttemptHistory, AnswerReview                      |
| Giảng viên xem tỷ lệ câu đúng/sai                                                                                            | QuestionStatsTable                                            |

### Thứ tự làm

1. Tạo `src/features/quizzes/` và quiz service theo các feature đang có. Dùng Quiz DTO, Result V2 và Quiz OpenAPI để viết các hàm tạo quiz, lấy lượt làm, lưu đáp án, nộp bài và xem kết quả. Thống nhất request/response với người phụ trách backend Quiz.
2. Form tạo quiz, thời lượng, số lần làm, SINGLE_CHOICE/MULTIPLE_CHOICE và lựa chọn. Đáp án đúng chỉ nằm ở phần soạn của giảng viên, không gửi cho người làm trước nộp.
3. Trình quiz dùng **Compound Component** đúng đề: component cha giữ trạng thái, component con đọc trạng thái chung thay vì truyền cùng props qua nhiều tầng.
4. Dùng Zustand persist giữ attemptId/lựa chọn/revision theo user và lượt làm. Reload đọc lại server, đối chiếu bản nháp, không tạo lượt mới. Không lưu đáp án đúng hoặc dùng state local tự quyết định điểm/thời gian làm bài.
5. Đồng hồ theo expiresAt server; lưu answers với expectedRevision, báo đang lưu/lỗi. Trước nộp phải lưu xong đáp án cuối; server kiểm tra hết giờ và chấm, UI không tự cấp điểm.
6. Start/submit dùng Idempotency-Key: gửi lại cùng thao tác giữ key để tránh trùng. Phân biệt đã nộp/đã chấm; điểm chưa có là null, không hiện điểm 0 giả.
7. Nối kết quả với TV4: có điểm chưa chắc Learning đã cập nhật. Hiện đang cập nhật khi cần; xem đáp án/giải thích chỉ khi server cho phép.

Cách ghép component Quiz:

```tsx
<Quiz attempt={attempt}>
  <Quiz.Timer />
  <Quiz.Navigation />
  <Quiz.Question />
  <Quiz.Submit />
</Quiz>
```

**Tự kiểm tra:** chọn một/nhiều đáp án, chuyển câu không mất bài, reload, save lỗi/version cũ, hết giờ, nộp hai lần, không đọc được lượt người khác. Backend phải test hàm chấm điểm và các trường hợp biên; frontend không thay backend chấm bài.

## 8. TV4 — Module Learning

**Nhánh:** `feat/learning/progress`.

### Cần đọc

- Frontend: [dashboard](<./src/app/(dashboard)/dashboard/page.tsx>), [course page](<./src/app/(course)/(workspace)/dashboard/courses/[courseId]/page.tsx>), [learning API](./src/features/learning/api.ts), [learning service](./src/services/learning.service.ts), [course service](./src/services/course.service.ts).
- Backend: [Learning README](https://github.com/maibui7879/lms-backend/blob/main/services/learning-service/README.md), [Learning DTO](https://github.com/maibui7879/lms-backend/blob/main/packages/contracts/src/http/learning.ts), [Progress controller](https://github.com/maibui7879/lms-backend/blob/main/services/learning-service/src/modules/progress/progress.controller.ts), [Reports controller](https://github.com/maibui7879/lms-backend/blob/main/services/learning-service/src/modules/instructor-reports/instructor-reports.controller.ts), [Discussion controller](https://github.com/maibui7879/lms-backend/blob/main/services/course-service/src/modules/discussions/discussions.controller.ts).

### Màn hình và component

| Màn hình                                                                                                                              | Component cần tạo/ghép                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [Student Dashboard](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=68-3), My Learning, Progress                 | LearningCourseCard, ProgressBar, ResumeButton                                            |
| [Học video và giáo trình](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=68-798)                                | LearningPage, ProgressBar, CompleteButton, ResumeButton; ghép nội dung TV2 và quiz TV3   |
| Hỏi đáp dưới bài                                                                                                                      | Ghép DiscussionList, DiscussionItem, ReplyForm do TV2 cung cấp; truyền courseId/lessonId |
| [Báo cáo giảng viên](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=100-1006), danh sách/chi tiết học viên, CSV | ReportFilters, LearnerTable, LearnerProgress, ExportCsvButton                            |
| [Chứng chỉ](https://www.figma.com/design/YXRuMQQZ4iqVI1RioMs2bE/Untitled?node-id=100-525), làm sau phần bắt buộc                      | CertificateCard, DownloadButton, VerifyCertificate                                       |

### Thứ tự làm

1. My Learning/dashboard lấy khóa đã ghi danh, tiến độ và chỗ học tiếp. Course API cung cấp cấu trúc/nội dung, Learning cung cấp tiến độ; không tạo hai bộ nội dung riêng.
2. Phụ trách file page trang học và LearningPage: ghép VideoPlayer, MarkdownContent, CurriculumSidebar từ TV2 với ProgressBar, CompleteButton và ResumeButton của mình. TV2 lo đọc/hiển thị nội dung Course; TV4 lo trạng thái học, lưu vị trí và hoàn thành. Không tạo player hoặc trình đọc Markdown thứ hai.
3. Trang học kiểm tra login/ghi danh, backend kiểm tra lại. Khóa chương/lý do khóa lấy từ API, không tự mở bài kế tiếp vì đã bấm nút UI.
4. Complete item/bài gửi `{ completed: true, contentVersion }`, đọc lại tiến độ. Quiz hoàn thành do backend quyết định. Item 100% chưa chắc khóa completed khi quiz bắt buộc chưa đạt.
5. Resume gửi lessonId/learningItemId/contentVersion/positionSeconds/expectedRevision. Lần đầu revision 0, lần sau dùng số server trả; bị 409 thì đọc lại. Không ghi checkpoint cũ sau khi đã chuyển bài.
6. Ghép component hỏi đáp TV2 cung cấp vào dưới bài học, truyền courseId/lessonId đang mở. TV2 phụ trách API/service, gửi câu hỏi/trả lời và phân trang; TV4 chỉ lo vị trí hiển thị và kiểm tra component nhận đúng bài khi chuyển bài. Không tạo bộ component hoặc hàm gọi API hỏi đáp thứ hai.
7. Báo cáo lấy học viên/tiến độ/điểm theo khóa giảng viên sở hữu, Admin theo quyền backend. TV3 cung cấp thống kê quiz. CSV xuất dữ liệu thật được phép đọc, đủ mọi trang phù hợp bộ lọc; xử lý dấu phẩy, xuống dòng và ô bị spreadsheet hiểu là công thức. Manifest hiện chưa có route xuất CSV riêng.
8. Làm dashboard tiến độ và báo cáo Learning trước, rồi mới chứng chỉ PDF/gợi ý học. Thống kê ghi danh của Course do TV2 làm; TV4 cung cấp số liệu hoàn thành/tiến độ từ Learning khi trang đó cần ghép thêm.

**Tự kiểm tra:** chưa/canceled enrollment, chương khóa, complete lặp không cộng đôi, contentVersion cũ, resume null/xung đột, chuyển bài truyền đúng ID cho nội dung/hỏi đáp TV2, giảng viên chỉ xem báo cáo khóa mình, CSV đúng bộ lọc/đủ dữ liệu. Frontend test hàm %/hiển thị biên; backend test quy tắc tiến độ thật.

## 9. Yêu cầu đề bài phải có người phụ trách

| Yêu cầu                                                     | Ai làm, làm ở đâu?                                                                                                                      |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript strict, generic, utility type, type guard        | Tất cả: giữ [strict config](./tsconfig.json), props/API có kiểu, any phải có lý do; dùng Partial/Pick/Omit/Record và type guard phù hợp |
| Hai custom hook generic                                     | TV1: useDebounce<T> hiện có + usePaginatedQuery<TItem> cần tạo và dùng trong danh sách, cả hai có test                                  |
| Feature folders, React pattern                              | Mọi người để code trong feature; TV3 làm Compound Component cho Quiz, giải thích trong báo cáo                                          |
| Zustand và Context                                          | TV1: phiên/ThemeContext; TV3: persist quiz; API dùng React Query, không copy toàn bộ sang Zustand                                       |
| Code splitting, memo/useMemo/useCallback có lý do           | TV3 tải quiz editor/player khi cần, TV4 tải báo cáo nặng khi cần; đo rồi tối ưu, giữ ảnh Profiler/Lighthouse trước và sau               |
| Danh sách từ 200 dòng                                       | TV1/TV2/TV4 dùng phân trang API, không render tất cả người dùng/khóa/học viên cùng lúc                                                  |
| Đăng ký/login, nhiều lớp bảo vệ, ít nhất hai role           | TV1 + backend; LMS làm đủ Student/Instructor/Admin. Cả nhóm thử API với tài khoản sai quyền                                             |
| Catalog SSG/ISR; trang riêng theo phiên                     | TV2 + TV1: render sẵn catalog, kiểm tra phiên trang học/quản lý; không cache công khai dữ liệu cá nhân                                  |
| loading/error, metadata, sitemap, robots                    | Đã có khung app; từng người bổ sung theo trang và ghi cách render vào báo cáo                                                           |
| Ít nhất 15 test, coverage 50% logic chính                   | Mỗi người thêm ít nhất 5 test có ý nghĩa: hàm, component tương tác, API async. TV1 cấu hình coverage và CI                              |
| Backend validation/Guard/Interceptor/Filter và test service | Đối chiếu phần backend tương ứng; ẩn nút frontend không thay kiểm tra quyền server                                                      |

**Next.js của repo:** [next.config.ts](./next.config.ts) bật cacheComponents/partialPrefetching, client mặc định no-store. TV2 cần làm cache dữ liệu công khai cho catalog, không chỉ ghi ISR trong báo cáo. Đọc `node_modules/next/dist/docs/01-app/02-guides/incremental-static-regeneration-cache-components.md`; không copy cấu hình cũ. Khi sửa code Next.js, đọc [AGENTS.md](./AGENTS.md) và guide của phiên bản đã cài.

**Coverage cần làm:** hiện có 10 test, chưa cấu hình coverage/ngưỡng 50%. TV1 thêm `@vitest/coverage-v8` khớp phiên bản Vitest, cấu hình thư mục logic chính trong [Vitest config](./vitest.config.mts), tính cả file chưa có test và ngưỡng tối thiểu 50%. Báo cáo số thật, không loại file khó để đạt số. Test UI bằng React Testing Library/user-event; mock API phải trả đúng dạng backend.

## 10. Cách làm và gửi code

Ví dụ TV2, bắt đầu từ working tree sạch:

```powershell
git fetch origin
git switch feat/courses/catalog-enrollment
git pull --ff-only
git merge origin/main
```

Chưa có nhánh local thì dùng `git switch --track origin/feat/courses/catalog-enrollment`. Mỗi người commit bằng tài khoản mình để thể hiện đóng góp theo đề.

Thứ tự mỗi màn: **đọc UI/API → chia component → làm giao diện → nối service → xử lý đang tải/rỗng/lỗi → test → thử backend thật → gửi pull request**. Mock dùng phát triển/test; chức năng chính khi nộp phải dùng DB qua backend.

```powershell
npm run check
npm run build
git diff --check
git status --short
```

Stage file của việc vừa làm, commit theo tính năng, push nhánh mình và mở PR về main. Sửa [client](./src/lib/api-client.ts), [types](./src/lib/types.ts), [root layout](./src/app/layout.tsx), [dashboard layout](<./src/app/(dashboard)/dashboard/layout.tsx>), [package.json](./package.json) hoặc lockfile thì báo nhóm. TV2 lo danh mục, chi tiết và soạn khóa học sau đăng nhập; TV4 lo trang học. Thống nhất trước khi cùng sửa course page hiện có.

- `npm run lint` / `npm run lint:fix`: kiểm tra/tự sửa lint.
- `npm run format` / `npm run format:check`: sửa/chỉ kiểm tra format.
- `npm test` / `npm run test:watch`: chạy test một lần/theo dõi khi code.
- `npm run check`: lint + format + test, chưa có build.
- Husky trước commit tự chạy Prettier trên file staged, rồi kiểm tra ESLint cho code; lint-staged tự đưa phần đã format vào commit và giữ phần thay đổi chưa stage. Các bước chạy tuần tự để tránh cùng sửa một file. Trước push chỉ kiểm tra format, không tự chạy test. CI vẫn kiểm tra lint/format/test trên GitHub.
- Cài dependencies sẽ bật hook. Checkout cũ cần bật lại thì chạy `npm run prepare`. Không đặt `HUSKY=0` khi commit/push local thông thường vì sẽ bỏ qua tự format; biến này chỉ dùng trong CI hoặc khi chủ động cần bỏ qua hook.
- [CI hiện tại](./.github/workflows/ci.yml) chạy lint/format/test trên push/PR, chưa có build/coverage. TV1 bổ sung coverage theo phần trên.

Trước gửi PR: đủ màn được giao, dùng được trên điện thoại, có loading/rỗng/lỗi, API kiểm tra quyền thật, checks pass. Ghi rõ màn chưa nối backend; không ghi hoàn thành khi mới dùng mock.

## 11. Phiên đăng nhập đang dùng

- [AuthProvider](./src/components/auth/auth-provider.tsx) bọc ứng dụng; dùng `useAuth()` để lấy user, trạng thái đang kiểm tra phiên, login/logout và tải lại phiên.
- [Auth store](./src/store/auth-store.ts) chỉ giữ user trong bộ nhớ; không có access/refresh token và không persist vào localStorage/sessionStorage. Reload được khôi phục từ cookie qua server.
- [Auth Route Handler](./src/app/api/auth/[action]/route.ts) nhận login/session/refresh/logout. Cookie HttpOnly, SameSite=Lax, Secure trong production; response không chứa token. Request thay đổi dữ liệu phải cùng origin.
- [Gateway Route Handler](./src/app/api/gateway/[...path]/route.ts) đọc cookie, gửi Bearer tới `API_GATEWAY_URL`. API client trình duyệt tự dùng tuyến này; các service Course/Learning/Users/Notification không còn tham số accessToken. Ví dụ: `courseService.createCourse(input)` và `courseService.getCourseOutline(courseId)`.
- Ở Server Component, gọi [requireUser](./src/lib/require-user.ts) trước khi đọc dữ liệu riêng, rồi dùng [serverApiRequest](./src/lib/server-api.ts). Helper chỉ gửi token ở server, không trả token cho component trình duyệt. Route Handler nghiệp vụ mới cũng phải kiểm tra phiên/quyền tương ứng.
- [Proxy](./src/proxy.ts) chỉ kiểm tra cookie để điều hướng sớm. User và role được xác minh lại qua Identity trong server page. Backend quyết định quyền sở hữu và ghi danh.
- Access hết hạn: Route Handler refresh và gửi lại request một lần khi nhận 401. Refresh bị từ chối thì xóa cookie/phiên và yêu cầu login; lỗi kết nối tạm thời không tự xóa phiên. Logout luôn xóa cookie local; nếu thu hồi ở backend lỗi, giao diện báo rõ.
- Refresh đồng thời được gộp trong một process Next.js. Khi triển khai nhiều instance cần cơ chế phối hợp dùng chung để tránh dùng lại refresh token đã rotate. OAuth callback chưa nối với luồng cookie này.
- Các test phiên dùng Gateway/Identity giả lập; cần chạy lại bằng tài khoản backend thật trước khi nghiệm thu tích hợp.

## 12. Chuẩn bị nộp bài

- Repo theo tên `<MãNhóm>_LTWNC_CuoiKy` hoặc thống nhất đường dẫn nộp với giảng viên; README có cách chạy, tài khoản demo từng role, lệnh seed thật. Demo/seed hiện cần bổ sung sau khi kiểm chứng.
- Báo cáo PDF tối đa **20 trang nội dung**: bảng quyền, cách render từng trang, lý do chọn state/pattern, ảnh UI, hiệu năng trước/sau, test/coverage, việc và % đóng góp từng người.
- Video **5–10 phút**: đăng ký/login → giảng viên tạo chương/bài/quiz → Admin duyệt → học viên ghi danh/học/quiz → xem tiến độ → giảng viên xem báo cáo/xuất CSV. Chỉ demo phần đã chạy, nêu phần chưa hoàn thành.
- Link triển khai là phần khuyến khích; không ghi đã deploy/đạt đủ đề khi chưa kiểm tra.

Đây là tài liệu giao việc. Các bước cần làm chưa được triển khai chỉ bằng việc cập nhật README.
