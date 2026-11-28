import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courseService } from "@/services/course.service";
import { ApiClientError } from "@/lib/api-client";
import { EnrollButton } from "@/components/courses/enroll-button";
import { courseDetailRoute, paths } from "@/route";
import { requireUser } from "@/lib/require-user";

export const metadata: Metadata = { title: courseDetailRoute.title };

async function CoursePreview({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  await requireUser(paths.course(courseId));
  const course = await courseService.getCourse(courseId).catch((error) => {
    if (error instanceof ApiClientError && error.status === 404) notFound();
    throw error;
  });
  if (course.status !== "PUBLISHED") notFound();
  return (
    <article className="dashboard-page">
      <Link href={paths.courses} className="dashboard-text-link">
        ← Khám phá khóa học
      </Link>
      <header className="dashboard-page-heading">
        <h1>{course.title}</h1>
        {course.subtitle && <p>{course.subtitle}</p>}
      </header>
      <section
        className="dashboard-start-section"
        aria-labelledby="course-description"
      >
        <h2 id="course-description" className="text-lg font-semibold">
          Giới thiệu khóa học
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-slate-700">
          {course.description}
        </p>
        {course.category && <p className="mt-4">Danh mục: {course.category}</p>}
        {course.language && <p>Ngôn ngữ: {course.language}</p>}
        {(
          [
            ["Bạn sẽ học được gì", course.learningOutcomes],
            ["Yêu cầu trước khi học", course.prerequisites],
            ["Khóa học dành cho ai", course.targetAudience],
          ] as const
        ).map(([title, items]) =>
          items && items.length > 0 ? (
            <section key={title} className="mt-6">
              <h3 className="font-semibold">{title}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </section>
      <section
        className="dashboard-start-section"
        aria-label="Ghi danh khóa học"
      >
        <EnrollButton key={course.id} courseId={course.id} />
      </section>
    </article>
  );
}

export default function CoursePage(props: {
  params: Promise<{ courseId: string }>;
}) {
  return (
    <Suspense fallback={<p role="status">Đang tải khóa học…</p>}>
      <CoursePreview {...props} />
    </Suspense>
  );
}
