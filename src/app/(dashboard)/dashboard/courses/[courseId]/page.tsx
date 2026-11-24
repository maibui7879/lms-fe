import type { Metadata } from "next";

export const metadata: Metadata = { title: "Khóa học" };

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <h1 className="text-3xl font-bold">Khóa học {courseId}</h1>;
}
