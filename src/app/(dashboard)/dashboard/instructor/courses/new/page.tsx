import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { paths } from "@/route/paths";
import { CourseForm } from "@/components/courses/course-form";
import Loading from "@/app/loading";

export const metadata = { title: "Tạo khóa học" };
async function NewCourse() {
  await requireUser(paths.newCourse, ["INSTRUCTOR"]);
  return (
    <div className="course-management">
      <Link href={paths.instructorCourses} className="dashboard-text-link">
        ← Quản lý khóa học
      </Link>
      <header className="course-management-heading">
        <h1>Tạo khóa học</h1>
      </header>
      <CourseForm />
    </div>
  );
}
export default function NewCoursePage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewCourse />
    </Suspense>
  );
}
