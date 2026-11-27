# LMS Frontend — Hướng dẫn đọc code và triển khai theo nhánh

Frontend Next.js của hệ thống LMS, phát triển riêng với [lms-backend](https://github.com/maibui7879/lms-backend). Người mới đọc mục 1–4, sau đó đọc phần của nhánh mình nhận. Mỗi nhánh chứa toàn bộ dự án; tên nhánh xác định phạm vi công việc, không phải một ứng dụng riêng.

## 1. Trạng thái thực tế và nguồn đối chiếu

Đối chiếu ngày **27/11/2026** với code frontend và backend trên `main`. Backend thay đổi độc lập: kiểm tra lại Swagger, controller và DTO trước mỗi task tích hợp.

| Phần            | Đã có trong frontend                                                                                                     | Cần triển khai tiếp                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Khung ứng dụng  | Next.js 16.4.6, React 19, TypeScript, Tailwind CSS 4; route `/`, `/login`, `/dashboard`, `/dashboard/courses/[courseId]` | Các trang còn là khung, chưa có luồng người dùng hoàn chỉnh                    |
| Gọi API         | HTTP client, feature API và service cho Auth, Users, Course, Learning, Notification                                      | Bổ sung DTO cụ thể, API còn thiếu và kiểm thử tích hợp                         |
| Xác thực        | Zustand session store, hàm login/refresh/logout                                                                          | Form, bảo vệ trang, xử lý hết hạn; sửa envelope login/refresh trước khi nối UI |
| Dữ liệu và form | Đã cài TanStack Query, React Hook Form, Zod                                                                              | Chưa có QueryClientProvider và các hook/form nghiệp vụ                         |
| Quiz            | Backend có contracts quiz/attempt/result                                                                                 | Frontend chưa có module Quiz; Gateway chưa public API Quiz                     |
| Chất lượng      | ESLint, Prettier, Vitest, Husky, GitHub Actions                                                                          | Hiện có 2 file/10 unit test; chưa có test trình duyệt hoặc E2E toàn hệ thống   |

**Khi tài liệu khác code:** kiểm tra route Gateway công bố → controller/DTO/response thực tế → contracts và business rules → tài liệu thiết kế. Nếu contract khác runtime, ghi rõ khác biệt và thống nhất với owner backend; không tự đổi giao thức để khớp riêng UI.

| Tài liệu/backend source                                                                                                                             | Mục đích                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [Gateway README](https://github.com/maibui7879/lms-backend/blob/main/apps/api-gateway/README.md)                                                    | Điểm vào HTTP, JWT, CORS, proxy, Socket.IO và cách chạy                                        |
| [Route manifest thực tế](https://github.com/maibui7879/lms-backend/blob/main/apps/api-gateway/src/routing/implemented-routes.json)                  | Method/path đã public; có route không đồng nghĩa luồng liên service đã được nghiệm thu         |
| [Contracts baseline](https://github.com/maibui7879/lms-backend/blob/main/packages/contracts/README.md)                                              | Envelope, pagination, quyền, version, idempotency và policy                                    |
| [Endpoint catalog](https://github.com/maibui7879/lms-backend/blob/main/packages/contracts/src/endpoints.ts)                                         | OperationId, request/response, quyền và mã lỗi mục tiêu                                        |
| [Phân tích và thiết kế](https://github.com/maibui7879/lms-backend/blob/main/docs/LMS_PROJECT_DOCUMENTATION.md)                                      | Actors, use case và luồng xuyên service; các mục đề xuất/lịch sử không phải báo cáo hoàn thành |
| [Handoff](https://github.com/maibui7879/lms-backend/blob/main/docs/HANDOFF.md), [WORK](https://github.com/maibui7879/lms-backend/blob/main/WORK.md) | Bối cảnh, thay đổi và giới hạn kiểm thử; đối chiếu code vì có mô tả scaffold đã cũ             |

Gateway hiện public Identity, Course, Learning và Notification. Không suy ra Quiz đã chạy chỉ vì có Quiz OpenAPI, DTO hoặc biến `QUIZ_URL`.

## 2. Cài đặt và chạy local

### Frontend

Dùng **Node.js 24**, cùng major với CI. Chạy trong thư mục frontend:

```powershell
git clone https://github.com/maibui7879/lms-fe.git
cd lms-fe
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Linux/macOS dùng `cp .env.example .env.local`. Nếu PowerShell chặn `npm.ps1`, thay `npm` bằng `npm.cmd`.

Theo [env mẫu](./.env.example):

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:5173
NEXT_PUBLIC_API_URL=http://localhost:3000
```

- Mở frontend tại `http://localhost:5173`.
- API URL là origin Gateway, **không thêm `/api/v1`** vì từng API module đã có prefix.
- `NEXT_PUBLIC_*` xuất hiện trong bundle trình duyệt; không chứa private key, DB URL hoặc token. Khởi động lại dev server sau khi sửa env.
- Chạy production build local bằng `npm run build` rồi `npm run start -- --port 5173`. Nếu không truyền port, Next.js start mặc định có thể trùng port 3000 của Gateway.

### Backend cần chạy những gì?

Clone/cài backend riêng; chạy các lệnh dưới ở root backend, không phải frontend:

```powershell
git clone https://github.com/maibui7879/lms-backend.git
cd lms-backend
npm ci
npm run build -w @lms/contracts
npm run build -w @lms/auth
```

Chuẩn bị env, DB/migration và dependency theo README từng service trước khi start. Những lệnh trên chưa khởi chạy toàn hệ thống.

| Thành phần   | Port dev | Khi cần                                                   |
| ------------ | -------: | --------------------------------------------------------- |
| Gateway      |     3000 | Mọi lần frontend gọi backend                              |
| Identity     |     3001 | Login/session, tài khoản và kiểm tra trạng thái tài khoản |
| Course       |     3002 | Catalog, nội dung, enrollment và cấu trúc cho Learning    |
| Quiz         |     3003 | Chưa tích hợp public; phối hợp owner Quiz/Gateway trước   |
| Learning     |     3004 | Progress, resume, dashboard, kết quả và chứng chỉ         |
| Notification |     3005 | Thông báo REST và thời gian thực                          |

Ví dụ chạy Gateway sau khi đã cấu hình env:

```powershell
npm run build -w @lms/api-gateway
npm run start -w @lms/api-gateway
```

Gateway cần `JWT_PUBLIC_KEY` khớp Identity và `GATEWAY_ALLOWED_ORIGINS` chứa `http://localhost:5173`; xem [env Gateway](https://github.com/maibui7879/lms-backend/blob/main/apps/api-gateway/.env.example). Không dùng mock token để nghiệm thu qua Gateway.

Kiểm tra `http://localhost:3000/health`, `http://localhost:3000/docs`, `http://localhost:3000/docs-json`. Health Gateway chỉ xác nhận process sống, không chứng minh upstream/DB sẵn sàng. Lấy tài khoản qua đăng ký/xác minh Identity hoặc dữ liệu dev do owner cung cấp; frontend không đảm bảo có tài khoản demo mặc định.

## 3. Đọc codebase theo thứ tự nào?

### Bản đồ thư mục

| Vị trí                                                                       | Trách nhiệm                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [package.json](./package.json), [env mẫu](./.env.example)                    | Scripts, dependencies, URL                                               |
| [src/app/](./src/app/), [root layout](./src/app/layout.tsx)                  | Page/layout, loading/error/not-found, metadata, font/CSS, robots/sitemap |
| [Login page](<./src/app/(auth)/login/page.tsx>)                              | Điểm bắt đầu Auth; chưa có form                                          |
| [Dashboard layout](<./src/app/(dashboard)/dashboard/layout.tsx>)             | Khung chung; chưa có auth guard                                          |
| [Course page](<./src/app/(dashboard)/dashboard/courses/[courseId]/page.tsx>) | Route động hiện có; mới hiển thị ID                                      |
| [HTTP client](./src/lib/api-client.ts)                                       | URL/query, fetch, headers, JSON/blob/204 và lỗi                          |
| [Types](./src/lib/types.ts)                                                  | Session, course, pagination và envelope                                  |
| [Features](./src/features/)                                                  | API theo miền nghiệp vụ; sở hữu method/path và kiểu request/response     |
| [Services](./src/services/), [unwrap helper](./src/services/api-result.ts)   | Hàm use case cho UI, phối hợp session, lấy `.data` đúng một lần          |
| [Auth store](./src/store/auth-store.ts)                                      | Session Zustand trong bộ nhớ trình duyệt                                 |
| [useDebounce](./src/hooks/use-debounce.ts)                                   | Debounce cho search hoặc checkpoint khi phù hợp                          |
| [Test setup](./src/test/setup.ts), [Vitest config](./vitest.config.mts)      | jsdom, alias `@` và mẫu tên test                                         |
| [CI](./.github/workflows/ci.yml), [Husky](./.husky/)                         | Kiểm tra trên GitHub và trước commit/push                                |

Route group `(auth)`/`(dashboard)` không xuất hiện trong URL: login là `/login`, không phải `/auth/login`.

### Lần theo một request

```text
page / component / hook
  → src/services/<domain>.service.ts
  → src/features/<domain>/api.ts
  → src/lib/api-client.ts
  → Gateway :3000/api/v1/...
  → service backend sở hữu nghiệp vụ
```

Đọc ví dụ: [course service](./src/services/course.service.ts) → [course API](./src/features/courses/api.ts) → [HTTP client](./src/lib/api-client.ts) → [Courses controller](https://github.com/maibui7879/lms-backend/blob/main/services/course-service/src/modules/courses/courses.controller.ts).

```ts
import { courseService } from "@/services/course.service";

// API trả { data: { items, page, limit, total }, meta }.
// Service đã unwrap .data, caller đọc result.items.
const result = await courseService.listCourses({ page: 1, limit: 12 });
const courses = result.items;
```

UI gọi service; không lặp URL/fetch trong component. Client trả nguyên payload thành công, không tự bỏ `.data`; feature API mô tả envelope, service unwrap. Response 204 trả `undefined`, PDF trả `Blob`, không dùng helper unwrap JSON cho hai dạng này.

### Server và Client Component

- Page/layout mặc định là Server Component. Giữ metadata và fetch công khai phù hợp ở server.
- Form, event handler, Zustand và React Query hooks cần Client Component với `"use client"`. Đặt form con trong feature, giữ page server để export metadata nếu cần.
- Auth store chỉ nằm trong bộ nhớ, reload sẽ mất session. Server Component không đọc được session Zustand của trình duyệt. Thống nhất chiến lược session/refresh trước khi làm protected server rendering; không dùng singleton token chung giữa các request server.
- [Course page](<./src/app/(dashboard)/dashboard/courses/[courseId]/page.tsx>) hiện nhận `params` là Promise và `await params`; không đổi về cú pháp cũ theo trí nhớ.
- Khi dùng coding agent, đọc [AGENTS.md](./AGENTS.md) và guide của Next.js đã cài, ví dụ `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`.

## 4. Cách triển khai một chức năng

1. Chốt use case, nhánh, owner/reviewer, màn hình và acceptance criteria. Tìm operationId trong catalog rồi kiểm tra method/path trong route manifest.
2. Đọc controller, DTO, response thực tế; ghi input/output, token/quyền, lỗi, version, idempotency. API chưa public thì dùng fixture có ghi rõ và báo dependency backend.
3. Định nghĩa request/response type và validation. Generic `<T>` hoặc `as T` không phải runtime validation. Các hàm đang nhận `unknown` cần kiểu cụ thể cho use case mình làm.
4. Bổ sung feature API → service → hook/form/component → page. Thư mục `components`, `hooks`, `schemas` trong từng feature là đề xuất để tạo khi cần, chưa có sẵn.
5. Xử lý loading/empty/error/success, disable submit trùng. Nếu dùng React Query, tạo provider trước, query key phân biệt user/resource, xóa cache khi logout/đổi tài khoản.
6. Test hành vi, chạy checks, kiểm thử qua Gateway thật. Ghi rõ provider nào mock/thật và API nào còn bị chặn.

| Tình huống  | Quy tắc frontend                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| URL/quyền   | Chỉ gọi Gateway `/api/v1/...`; không gọi port nội bộ hoặc `/internal/...`. Backend quyết định quyền cuối cùng                                 |
| Token       | Truyền access token vào service; client thêm Bearer. Không gửi role/userId để giả danh                                                        |
| Pagination  | Đọc `{ items, page, limit, total }` sau unwrap; baseline page từ 1, limit tối đa 100, đối chiếu DTO thực tế                                   |
| ID/query    | Encode ID trong API module, query qua options; không nối chuỗi `?` thủ công, không gửi field endpoint không nhận                              |
| Lỗi         | Bắt `ApiClientError` theo `status`/`code`, giữ `requestId` để tra log. Network error có thể là lỗi fetch thông thường                         |
| 401/403     | 401: refresh hoặc yêu cầu login theo chính sách; 403: không đủ quyền. Client hiện chưa tự refresh/retry                                       |
| 409         | Đọc lại dữ liệu/version và báo conflict; không lặp mutation vô hạn                                                                            |
| 503/504     | Hiển thị dependency lỗi/timeout, giữ input để thử lại; không biến thành dữ liệu rỗng hoặc thành công                                          |
| Version     | Gửi expectedVersion/expectedRevision từ lần đọc gần nhất; không hard-code. DELETE course cũng cần body version                                |
| Idempotency | Với operation yêu cầu key, retry cùng thao tác/payload giữ nguyên key; thao tác mới dùng key mới. Client hỗ trợ header nhưng chưa tự sinh key |

## 5. Phạm vi và hướng dẫn cho từng nhánh

| Nhánh                             | Phạm vi                                                                           | Cần phối hợp                               |
| --------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------ |
| `main`                            | Baseline tích hợp, nhận PR đã review                                              | CI và kiểm chứng luồng thật                |
| `feat/shared/gateway-api-client`  | Client, envelope/error, types, provider/cache chung                               | Tất cả nhánh nghiệp vụ                     |
| `feat/auth/login`                 | Login/session, quyền, account/profile khi mở rộng                                 | Shared, dashboard layout, caller cần token |
| `feat/courses/catalog-enrollment` | Catalog/detail/enrollment; authoring khi mở rộng                                  | Auth, Learning; cùng dùng course page      |
| `feat/learning/progress`          | Dashboard, nội dung học, progress/resume/access; reports/certificates khi mở rộng | Auth, Course, Quiz result/sync             |
| `feat/quizzes/quiz-player`        | Attempt, answers/autosave, submit/result/history                                  | Backend Quiz, Gateway và Learning          |

Đây là phạm vi đề xuất theo nhánh hiện có, không phải báo cáo tính năng hoàn thành. Chốt owner/reviewer trước khi nhận việc. Ổn định shared/envelope trước; Auth và catalog có thể phát triển song song bằng fixture. Tích hợp login → catalog/detail → enroll → learning/progress → quiz khi backend sẵn sàng. Tách tính năng nâng cao thành PR riêng.

### 5.1. `feat/shared/gateway-api-client`

**Đọc:** [HTTP client](./src/lib/api-client.ts), [types](./src/lib/types.ts), [unwrap helper](./src/services/api-result.ts), [client tests](./src/lib/api-client.test.ts), [Gateway README](https://github.com/maibui7879/lms-backend/blob/main/apps/api-gateway/README.md).

**Các bước làm:**

1. Giữ chuẩn URL/query, Authorization, error/requestId, 204 và Blob. Thêm test response envelope thật và failure paths trước khi đổi hành vi chung.
2. Phối hợp Auth sửa login/refresh envelope tại feature/service. Không đổi client thành auto-unwrap mọi JSON vì các service đang unwrap sẽ bị unwrap hai lần.
3. Khi cần React Query, bổ sung QueryClientProvider trong Client Component, ghép vào root layout; thống nhất query key và cache cleanup theo session. Provider hiện chưa có.
4. Bổ sung types/schema theo response thực tế. Frontend không import file từ checkout backend bên cạnh hoặc đọc repo backend lúc runtime; đồng bộ contracts phải qua cách nhóm thống nhất.
5. Nếu nhận thông báo chung, dùng [notification service](./src/services/notification.service.ts). REST wrappers đã có; Socket.IO client chưa cài/triển khai. Khi bổ sung, kết nối qua Gateway và cleanup lúc logout theo [hướng dẫn Gateway](https://github.com/maibui7879/lms-backend/blob/main/apps/api-gateway/README.md).

**Nghiệm thu:** query/token/body/header đúng; lỗi 401/403/409/503/504 giữ code/requestId; 204 không parse JSON; PDF là Blob; không rò cache giữa user; wrappers hiện tại vẫn hoạt động.

### 5.2. `feat/auth/login`

**Đọc:** [login page](<./src/app/(auth)/login/page.tsx>), [auth API](./src/features/auth/api.ts), [auth service](./src/services/auth.service.ts), [store](./src/store/auth-store.ts), [auth tests](./src/services/auth.service.test.ts), [Identity README](https://github.com/maibui7879/lms-backend/blob/main/services/identity-service/README.md), [Auth controller](https://github.com/maibui7879/lms-backend/blob/main/services/identity-service/src/modules/auth/auth.controller.ts).

**Lỗi tích hợp cần sửa trước:** login/refresh frontend đang khai báo `AuthSession` trực tiếp. Backend có [EnvelopeInterceptor](https://github.com/maibui7879/lms-backend/blob/main/services/identity-service/src/common/interceptors/envelope.interceptor.ts), nên HTTP trả `ApiResponse<AuthSession>`. Sửa type và unwrap đúng một lần trước `setSession`. Test hiện mock session trực tiếp nên chưa kiểm chứng wire response. README này chỉ ghi nhận việc cần làm, chưa sửa logic đó.

**Các bước làm:**

1. Sửa envelope, thêm regression test ở ranh giới fetch/API/service; store phải có `session.accessToken`, không lưu cả `{ data, meta }`.
2. Làm login form bằng React Hook Form/Zod trong Client Component; gọi `authService.login`, hiển thị validation/server errors và pending, chuyển dashboard khi thành công.
3. Bảo vệ dashboard phía UI và hiển thị trạng thái thiếu quyền. Backend vẫn phải kiểm tra token, account status, role/ownership.
4. Chốt cách reload/session expiry vì store chưa persist. Nếu làm auto-refresh, gom các request 401 đồng thời vào một refresh, retry tối đa một lần và cập nhật refresh token mới sau rotation. Không đọc browser store từ Server Component.
5. Nối logout và xóa cache riêng tư. Giữ `finally` hiện có: backend logout lỗi vẫn phải xóa session local.
6. Register/OTP/reset password/profile làm task riêng. [Users API](./src/features/users/api.ts) và [user service](./src/services/user.service.ts) có wrappers nhưng chưa có UI. OAuth phải thống nhất callback/redirect với Identity; có URL bắt đầu chưa có nghĩa callback frontend đã hoàn thành.

API chính đã public: `POST /api/v1/auth/login`, `/refresh`, `/logout`, `/logout-all`; `GET /api/v1/users/me`. Validation đọc DTO hiện tại; baseline và RegisterDto có khác biệt giới hạn password cần owner thống nhất trước khi áp dụng lên form.

**Nghiệm thu:** login hợp lệ/sai mật khẩu/inactive; response envelope thật; chưa login; token hết hạn/refresh bị từ chối; logout lỗi vẫn xóa state/cache; đổi user không thấy dữ liệu user trước. Tự đăng ký không được tự cấp Admin/Instructor.

### 5.3. `feat/courses/catalog-enrollment`

**Đọc:** [course API](./src/features/courses/api.ts), [service](./src/services/course.service.ts), [types](./src/lib/types.ts), [course page](<./src/app/(dashboard)/dashboard/courses/[courseId]/page.tsx>), [Course README](https://github.com/maibui7879/lms-backend/blob/main/services/course-service/README.md), [Enrollment controller](https://github.com/maibui7879/lms-backend/blob/main/services/course-service/src/modules/enrollments/enrollments.controller.ts), [Course DTO](https://github.com/maibui7879/lms-backend/blob/main/packages/contracts/src/http/course.ts).

**Các bước làm:**

1. Catalog: `listCourses` với search/filter/pagination; reset page khi đổi filter, debounce khi cần. Chốt public route catalog/detail trước khi tạo vì hiện chỉ có course page trong dashboard.
2. Detail: `getCourse` lấy metadata công khai; `getCourseOutline` cần token. Phân biệt 404/quyền và lỗi mạng; không đưa nội dung học riêng tư ra public page.
3. Enrollment: có token gọi `enrollInCourse`, chưa login thì đi qua Auth. Backend lấy user từ JWT; không gửi userId/instructorId từ UI. Endpoint enroll hiện không cần body nghiệp vụ, không gửi field tùy ý chỉ vì wrapper nhận `unknown`.
4. My courses: `listMyEnrollments`, hủy bằng `cancelEnrollment`; refetch/invalidate danh sách và phối hợp Learning khi enrollment thay đổi. Thêm DTO enrollment cụ thể thay vì tự đoán generic.
5. Authoring nếu được giao: tách PR CRUD course → chapter/lesson/item → review/revision. Bổ sung wrappers còn thiếu; dùng version server, xử lý 409 và ownership; không sửa snapshot published như draft.

| API chính                                                       | Wrapper frontend                          |
| --------------------------------------------------------------- | ----------------------------------------- |
| `GET /api/v1/courses`, `GET /api/v1/courses/{id}`               | Có                                        |
| `GET /api/v1/courses/{id}/outline`                              | Có, cần token                             |
| `POST /api/v1/courses/{id}/enrollments`                         | Có                                        |
| `GET /api/v1/enrollments/me`, `DELETE /api/v1/enrollments/{id}` | Có                                        |
| CRUD course, `GET /api/v1/instructor/courses`                   | Có; UI/quyền cần triển khai               |
| Chapters/lessons/items, review/revisions/discussions            | Gateway có route; thêm wrappers theo task |

**Nghiệm thu:** list rỗng/filter/pagination; course 404; enroll chưa login/sai quyền/đã tồn tại theo hành vi backend; cancel; double-click; update stale version. Sau enroll phải thử access và progress qua Gateway thật, không chỉ kiểm tra nút đổi trạng thái.

### 5.4. `feat/learning/progress`

**Đọc:** [learning API](./src/features/learning/api.ts), [service](./src/services/learning.service.ts), [dashboard page](<./src/app/(dashboard)/dashboard/page.tsx>), [Learning README](https://github.com/maibui7879/lms-backend/blob/main/services/learning-service/README.md), [Learning DTO](https://github.com/maibui7879/lms-backend/blob/main/packages/contracts/src/http/learning.ts), [Progress controller](https://github.com/maibui7879/lms-backend/blob/main/services/learning-service/src/modules/progress/progress.controller.ts).

**Các bước làm:**

1. Thêm types cụ thể cho dashboard/progress/access/resume thay các `<T>`/`unknown`. Đối chiếu contentVersion với Course/enrollment.
2. Dashboard dùng `getDashboard`; trang học phối hợp outline Course và `getCourseProgress`, `getLessonProgress`, `getChapterAccess`. Chốt ownership course page với nhánh Course trước khi cùng sửa.
3. Hiển thị chapter `LOCKED`/`UNLOCKED`/`COMPLETED` và reason server; không tự mở khóa theo số thứ tự hoặc phần trăm UI tính.
4. `completeItem`/`completeLesson` gửi `{ completed: true, contentVersion }` theo DTO; không tự đánh dấu QUIZ completed từ trình duyệt. Đọc lại progress/access/dashboard sau mutation.
5. Resume có thể trả `null`. `saveResume` gửi lessonId, learningItemId, contentVersion, positionSeconds, expectedRevision. Checkpoint đầu revision 0, lần sau dùng revision response; debounce và điều phối request tránh ghi đè vị trí mới, 409 phải đọc lại.
6. Quiz scores, sync, certificates, mastery/recommendations và reports là task tiếp theo. Một số wrapper đã có; sync/issue certificate và một số báo cáo cần bổ sung. Không coi `progressPercent === 100` là đủ để kết luận khóa completed.

API cốt lõi: `GET /api/v1/learning/me/dashboard`; `GET /api/v1/learning/courses/{id}/progress`, `/chapters/access`, `/resume`; `PUT /api/v1/learning/courses/{id}/resume`; `GET /api/v1/learning/lessons/{id}/progress`; `PUT /api/v1/learning/items/{id}/completion` và `PUT /api/v1/learning/lessons/{id}/completion`.

Quiz chấm xong và Learning đồng bộ là hai trạng thái riêng. Gateway có `GET /api/v1/learning/attempts/{id}/sync`, nhưng Quiz chưa public. Khi tích hợp, hiển thị `PENDING`/`SYNCED`/`FAILED` theo receipt; không tự đổi timeout thành FAILED hoặc cộng progress ngay khi submit.

**Nghiệm thu:** thiếu/canceled enrollment; chapter khóa; completion lặp; contentVersion cũ; resume null/revision conflict; đổi bài/rời trang không ghi checkpoint sai; item 100% nhưng assessment chưa đạt; dependency Course/Quiz lỗi phải hiển thị đúng.

### 5.5. `feat/quizzes/quiz-player`

**Đọc:** [Quiz README](https://github.com/maibui7879/lms-backend/blob/main/services/quiz-service/README.md), [Quiz DTO](https://github.com/maibui7879/lms-backend/blob/main/packages/contracts/src/http/quiz.ts), [Result V2](https://github.com/maibui7879/lms-backend/blob/main/packages/contracts/src/http/quiz-result.ts), [Quiz OpenAPI](https://github.com/maibui7879/lms-backend/blob/main/packages/contracts/openapi/quiz.json), [route manifest](https://github.com/maibui7879/lms-backend/blob/main/apps/api-gateway/src/routing/implemented-routes.json).

**Dependency:** backend Quiz còn scaffold, Gateway chưa map quiz/course assessments. Chưa thể nghiệm thu start/save/submit thật. Không gọi thẳng port 3003 để né Gateway.

**Làm trước bằng fixture/test adapter:**

1. Chốt DTO delivery/attempt/Result V2; tách câu hỏi học viên khỏi authoring có đáp án. Module `src/features/quizzes/` và quiz service là phần cần tạo, chưa có trong source.
2. Player SINGLE_CHOICE/MULTIPLE_CHOICE, chuyển câu, giữ lựa chọn và trạng thái lưu/lỗi. Fixture ghi rõ dữ liệu test, không coi là API thật.
3. Countdown dựa `expiresAt` server, không tính deadline từ lúc mở trang. Reload phải khôi phục cùng attempt/snapshot, không tạo attempt mới hoặc shuffle lại.
4. Autosave dùng expectedRevision, xử lý ghi tuần tự/conflict. Submit phải bảo đảm answers cuối đã lưu vì backend chấm answers đã lưu; lỗi autosave phải được xử lý trước khi nộp.
5. Start/submit dùng Idempotency-Key theo contract; retry cùng thao tác giữ key. Điểm/passed do backend tính.
6. Result tách attemptStatus và gradingStatus; chưa chấm thì score/maxScore/passed là null, không hiển thị điểm 0 hoặc trượt giả. Hiện đáp án/review theo policy server.

**Khi backend sẵn sàng:** owner triển khai controller và cập nhật Gateway manifest/Swagger; đối chiếu method/path/payload, thêm wrappers thật, chuyển adapter, chạy qua Gateway. Phối hợp Learning để hiển thị sync receipt; fixture test pass chưa đủ kết luận tích hợp.

**Nghiệm thu:** không lộ answer keys; reload giữ snapshot; save conflict; submit/retry không nhân đôi; deadline server; max attempts; kết quả chưa chấm; sync chậm/lỗi; không xem attempt người khác. Các ca tích hợp chỉ đánh dấu đạt khi có provider thật.

## 6. Git workflow và phối hợp

Ví dụ nhận catalog/enrollment, bắt đầu từ working tree sạch:

```powershell
git fetch origin
git switch feat/courses/catalog-enrollment
git pull --ff-only
git merge origin/main
```

Chưa có branch local thì dùng `git switch --track origin/feat/courses/catalog-enrollment`. Conflict cần xử lý cùng owner file rồi chạy lại checks; `git merge --abort` hủy merge chưa hoàn tất.

Sau một task nhỏ:

```powershell
npm run check
npm run build
git diff --check
git status --short
git add -- <cac-file-cua-task>
git diff --cached
git commit -m "feat(courses): add catalog pagination"
git push -u origin feat/courses/catalog-enrollment
```

Thay `<cac-file-cua-task>` bằng file thật; stage thêm test/docs/env example/lockfile khi task đổi chúng. Mở PR base `main`, compare nhánh task. Sau khi shared/Auth merge, các nhánh phụ thuộc fetch và merge `origin/main`.

Không push tính năng sang mọi nhánh. Lần đồng bộ baseline trước đây là khởi tạo; task mới đi qua PR. Review chung khi sửa [client](./src/lib/api-client.ts), [types](./src/lib/types.ts), [root layout](./src/app/layout.tsx), [dashboard layout](<./src/app/(dashboard)/dashboard/layout.tsx>), [package.json](./package.json) hoặc lockfile.

Lịch sử từng được viết lại để gỡ attribution Copilot. Clone cũ cần kiểm tra divergence, bảo toàn việc chưa push trước khi đồng bộ; không force-push lịch sử cũ trở lại remote.

## 7. Kiểm thử, CI và điều kiện hoàn thành

| Lệnh                   | Tác dụng                                                                |
| ---------------------- | ----------------------------------------------------------------------- |
| `npm run lint`         | ESLint toàn dự án; warning cũng làm thất bại                            |
| `npm run lint:fix`     | Tự sửa lỗi lint hỗ trợ                                                  |
| `npm run format`       | Prettier ghi định dạng                                                  |
| `npm run format:check` | Kiểm tra format, không sửa                                              |
| `npm test`             | Chạy toàn bộ Vitest một lần                                             |
| `npm run test:watch`   | Test watch khi phát triển                                               |
| `npm run check`        | Lint → format:check → test                                              |
| `npm run build`        | Build riêng; chưa nằm trong check/CI                                    |
| `npm run prepare`      | Kích hoạt lại Husky sau khi pull setup vào checkout đã cài dependencies |

Test đặt cạnh code dạng `*.test.ts(x)`/`*.spec.ts(x)` trong source. Vitest mặc định jsdom; [client test](./src/lib/api-client.test.ts) dùng annotation môi trường Node. Chạy riêng:

```powershell
npm test -- src/lib/api-client.test.ts
npm test -- src/services/auth.service.test.ts
```

[Auth tests](./src/services/auth.service.test.ts) mock API, [client tests](./src/lib/api-client.test.ts) mock fetch; không gọi backend thật. Thêm test hành vi thành công, validation/quyền, conflict và dependency tương ứng. Test response envelope thật ở ranh giới dữ liệu thay vì chỉ mock kiểu mong muốn. Async Server Component cần cách kiểm thử phù hợp; không mặc định render mọi async page trực tiếp bằng Vitest.

[Pre-commit](./.husky/pre-commit) chạy lint-staged: ESLint fix + Prettier cho source staged, Prettier cho tài liệu/config hỗ trợ; fix được stage lại, lỗi còn lại chặn commit. [Pre-push](./.husky/pre-push) chạy toàn bộ test. `npm ci`/`npm install` kích hoạt hooks qua prepare.

[CI](./.github/workflows/ci.yml) có ba job độc lập lint/format:check/test trên mọi push/PR, hỗ trợ chạy tay; Node 24, npm ci, HUSKY=0. Unit tests hiện không cần backend/secrets. [Prettier ignore](./.prettierignore) bỏ qua output sinh, lockfile và hướng dẫn agent.

Một task sẵn sàng merge khi:

- Đúng scope, route/DTO/quyền đối chiếu backend; ghi rõ API chưa public.
- Có pending/empty/error/success, dữ liệu riêng tư theo đúng session.
- Có test hành vi cần thiết; lint/format/test pass; kiểm tra build khi sửa ứng dụng.
- Task tích hợp đã chạy qua Gateway bằng tài khoản đúng quyền; ghi provider thật/fixture và giới hạn còn lại.
- PR nêu chức năng, phần chung ảnh hưởng, lệnh kiểm thử; cập nhật docs/env example khi cần.

README thuần túy chỉ cần kiểm tra nội dung, links, format và diff; không cần chạy lại toàn bộ business tests.
