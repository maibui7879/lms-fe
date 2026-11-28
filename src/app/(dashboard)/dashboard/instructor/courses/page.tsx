import { Suspense } from "react";
import Link from "next/link";
import { Plus, Search, BookOpen } from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { serverApiRequest } from "@/lib/server-api";
import type { ApiResponse, Course, PageData } from "@/lib/types";
import { CourseCover } from "@/components/courses/course-cover";
import { paths } from "@/route/paths";
import Loading from "@/app/loading";
import type { CatalogSearchParams } from "@/features/courses/catalog-query";

export const metadata = { title: "Quản lý khóa học" };
const statuses = {
  DRAFT: "Bản nháp",
  IN_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  REJECTED: "Cần chỉnh sửa",
};

async function CourseList({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  await requireUser(paths.instructorCourses, ["INSTRUCTOR"]);
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page =
    Number.isInteger(rawPage) && rawPage > 0 && rawPage <= 100000 ? rawPage : 1;
  const search =
    typeof params.search === "string" ? params.search.trim().slice(0, 200) : "";
  const status =
    typeof params.status === "string" && Object.hasOwn(statuses, params.status)
      ? (params.status as keyof typeof statuses)
      : undefined;
  const { data } = await serverApiRequest<ApiResponse<PageData<Course>>>(
    "/api/v1/instructor/courses",
    {
      query: {
        page,
        limit: 9,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      },
    },
  );
  const href = (nextStatus?: string, nextPage = 1) => {
    const query = new URLSearchParams({ page: String(nextPage) });
    if (search) query.set("search", search);
    if (nextStatus) query.set("status", nextStatus);
    return `${paths.instructorCourses}?${query}`;
  };
  return (
    <div className="course-management">
      <header className="course-management-heading">
        <h1>Quản lý khóa học</h1>
        <Link href={paths.newCourse} className="course-action">
          <Plus size={17} aria-hidden="true" />
          Tạo khóa học
        </Link>
      </header>
      {typeof params.created === "string" &&
        data.items.some((course) => course.id === params.created) && (
          <p role="status" className="course-success">
            Đã tạo khóa học nháp.
          </p>
        )}
      <div className="course-management-toolbar">
        <nav aria-label="Trạng thái khóa học" className="course-status-tabs">
          <Link href={href()} aria-current={!status ? "page" : undefined}>
            Tất cả
          </Link>
          {Object.entries(statuses).map(([key, label]) => (
            <Link
              key={key}
              href={href(key)}
              aria-current={status === key ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <form
          action={paths.instructorCourses}
          method="get"
          className="course-list-search"
          role="search"
        >
          <Search size={16} aria-hidden="true" />
          <label htmlFor="instructor-search" className="sr-only">
            Tìm khóa học của bạn
          </label>
          <input
            id="instructor-search"
            name="search"
            type="search"
            defaultValue={search}
            maxLength={200}
            placeholder="Tìm khóa học…"
          />
          {status && <input type="hidden" name="status" value={status} />}
          <button type="submit">Tìm</button>
        </form>
      </div>
      <p className="course-total">{data.total} khóa học</p>
      {data.items.length ? (
        <ul className="course-management-grid">
          {data.items.map((course) => (
            <li key={course.id}>
              <div className="course-management-cover">
                <CourseCover src={course.thumbnailUrl} title={course.title} />
                <span
                  className={`dashboard-course-status status-${course.status.toLowerCase()}`}
                >
                  {statuses[course.status]}
                </span>
              </div>
              <div className="course-management-copy">
                {course.category && (
                  <span className="course-category">{course.category}</span>
                )}
                <h2>{course.title}</h2>
                <p>
                  {course.subtitle ||
                    course.description.replace(/<[^>]*>/g, " ")}
                </p>
                <time dateTime={course.updatedAt}>
                  Cập nhật{" "}
                  {new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "medium",
                  }).format(new Date(course.updatedAt))}
                </time>
                {course.status === "PUBLISHED" && (
                  <Link
                    href={paths.course(course.id)}
                    className="dashboard-text-link"
                  >
                    Xem khóa học →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <section className="course-list-empty">
          <BookOpen size={30} aria-hidden="true" />
          <h2>
            {search || status
              ? "Không có khóa học phù hợp"
              : "Bạn chưa có khóa học"}
          </h2>
          {search || status ? (
            <Link href={paths.instructorCourses}>Xóa bộ lọc</Link>
          ) : (
            <Link href={paths.newCourse} className="course-action">
              Tạo khóa học
            </Link>
          )}
        </section>
      )}
      {data.total > data.limit && (
        <nav className="catalog-pagination" aria-label="Phân trang khóa học">
          {page > 1 ? (
            <Link href={href(status, page - 1)}>← Trang trước</Link>
          ) : (
            <span />
          )}
          <span>
            Trang {data.page} / {Math.ceil(data.total / data.limit)}
          </span>
          {page * data.limit < data.total ? (
            <Link href={href(status, page + 1)}>Trang sau →</Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
export default function InstructorCoursesPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <CourseList searchParams={searchParams} />
    </Suspense>
  );
}
