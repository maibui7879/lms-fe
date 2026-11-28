import { Suspense } from "react";
import { CourseCatalog } from "@/components/courses/course-catalog";
import { requireUser } from "@/lib/require-user";
import { paths } from "@/route/paths";
import type { CatalogSearchParams } from "@/features/courses/catalog-query";
import Loading from "@/app/loading";

export const metadata = { title: "Danh sách khóa học" };

async function Courses({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  await requireUser(paths.courses);
  return (
    <div className="dashboard-page">
      <CourseCatalog
        searchParams={searchParams}
        basePath={paths.courses}
        headingLevel={1}
      />
    </div>
  );
}

export default function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <Courses searchParams={searchParams} />
    </Suspense>
  );
}
