import Link from "next/link";
import { BookOpen, ArrowUpRight, Search, Globe2 } from "lucide-react";
import { CourseCover } from "./course-cover";
import { courseService } from "@/services/course.service";
import { paths } from "@/route/paths";
import {
  catalogPageHref,
  getCatalogQuery,
  type CatalogSearchParams,
} from "@/features/courses/catalog-query";
import type { Course, CourseQuery, PageData } from "@/lib/types";

export function CatalogView({
  courses,
  query,
  basePath,
  headingLevel = 2,
  title = "Khám phá khóa học",
  showSearch = true,
}: {
  courses: PageData<Course>;
  query: CourseQuery;
  basePath: string;
  headingLevel?: 1 | 2;
  title?: string;
  showSearch?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(courses.total / courses.limit));
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const filtered = Boolean(query.search || query.category || query.level);
  return (
    <section
      id="catalog"
      className="catalog-section"
      aria-labelledby="catalog-title"
    >
      <div className="catalog-heading">
        <div>
          <Heading id="catalog-title">{title}</Heading>
        </div>
      </div>
      {showSearch && (
        <form
          action={basePath}
          method="get"
          className="catalog-search"
          role="search"
        >
          <label htmlFor="course-search" className="sr-only">
            Tìm khóa học
          </label>
          <Search size={17} aria-hidden="true" />
          {query.level && (
            <input type="hidden" name="level" value={query.level} />
          )}
          {query.category && (
            <input type="hidden" name="category" value={query.category} />
          )}
          {query.sort && <input type="hidden" name="sort" value={query.sort} />}
          {query.direction && (
            <input type="hidden" name="direction" value={query.direction} />
          )}
          <input
            id="course-search"
            name="search"
            type="search"
            defaultValue={query.search ?? ""}
            placeholder="Tìm kiếm khóa học theo tên, nội dung…"
            maxLength={200}
          />
          <button type="submit">Tìm kiếm</button>
        </form>
      )}
      <p className="catalog-result-count">
        {courses.total}{" "}
        {query.search ? `kết quả cho “${query.search}”` : "khóa học"}
      </p>
      {courses.items.length === 0 ? (
        <div className="catalog-empty">
          <BookOpen size={28} aria-hidden="true" />
          <h3>
            {filtered
              ? "Không tìm thấy khóa học"
              : "Chưa có khóa học được xuất bản"}
          </h3>
          <p>
            {filtered
              ? "Thử từ khóa khác hoặc xóa tìm kiếm để xem tất cả khóa học."
              : "Quay lại sau để khám phá nội dung mới."}
          </p>
          {filtered && <Link href={basePath}>Xóa bộ lọc</Link>}
        </div>
      ) : (
        <ul className="course-card-grid">
          {courses.items.map((course) => (
            <li key={course.id}>
              <Link
                href={paths.course(course.id)}
                className="course-card-cover-link"
                aria-label={`Xem ${course.title}`}
                tabIndex={-1}
              >
                <CourseCover src={course.thumbnailUrl} title={course.title} />
                {course.category && (
                  <span className="course-card-category">
                    {course.category}
                  </span>
                )}
              </Link>
              <div className="catalog-course-copy">
                <h3>
                  <Link href={paths.course(course.id)}>{course.title}</Link>
                </h3>
                <p>
                  {course.subtitle ||
                    course.description.replace(/<[^>]*>/g, " ")}
                </p>
                <div className="catalog-course-tags">
                  {course.tags?.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className="course-card-footer">
                {course.language && (
                  <span>
                    <>
                      <Globe2 size={13} aria-hidden="true" />
                      {course.language}
                    </>
                  </span>
                )}
                <Link
                  href={paths.course(course.id)}
                  className="catalog-course-link"
                  aria-label={`Xem thông tin ${course.title}`}
                >
                  Xem khóa học <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav className="catalog-pagination" aria-label="Phân trang khóa học">
          {courses.page > 1 ? (
            <Link href={catalogPageHref(basePath, query, courses.page - 1)}>
              ← Trang trước
            </Link>
          ) : (
            <span />
          )}
          <span>
            Trang {courses.page} / {pages}
          </span>
          {courses.page < pages ? (
            <Link href={catalogPageHref(basePath, query, courses.page + 1)}>
              Trang sau →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </section>
  );
}

export async function CourseCatalog({
  searchParams,
  basePath,
  headingLevel,
}: {
  searchParams: Promise<CatalogSearchParams>;
  basePath: string;
  headingLevel?: 1 | 2;
}) {
  const query = getCatalogQuery(await searchParams);
  const courses = await courseService.listCourses(query);
  return (
    <CatalogView
      courses={courses}
      query={query}
      basePath={basePath}
      headingLevel={headingLevel}
    />
  );
}
