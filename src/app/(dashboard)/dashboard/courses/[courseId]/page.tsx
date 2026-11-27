import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/require-user";

export const metadata: Metadata = { title: "Khóa học" };

async function ProtectedCourse({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  await requireUser(`/dashboard/courses/${encodeURIComponent(courseId)}`);
  return <h1 className="text-3xl font-bold">Khóa học {courseId}</h1>;
}

export default function CoursePage(props: {
  params: Promise<{ courseId: string }>;
}) {
  return (
    <Suspense fallback={<p>Đang kiểm tra phiên…</p>}>
      <ProtectedCourse {...props} />
    </Suspense>
  );
}
