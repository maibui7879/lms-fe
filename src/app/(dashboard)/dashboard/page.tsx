import type { Metadata } from "next";
import { DashboardOverview } from "@/components/layout/dashboard-overview";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { CourseCatalog } from "@/components/courses/course-catalog";
import type { CatalogSearchParams } from "@/features/courses/catalog-query";
import { Suspense } from "react";
import { requireUser } from "@/lib/require-user";
import { getDashboardRoute, overviewTitles, paths } from "@/route";

export const metadata: Metadata = {
  title: getDashboardRoute(paths.dashboard)?.title,
};

async function ProtectedOverview({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const user = await requireUser(paths.dashboard);
  const query = await searchParams;
  const catalog =
    user.role === "STUDENT" || typeof query.search === "string" ? (
      <Suspense fallback={<p role="status">Đang tải khóa học…</p>}>
        <CourseCatalog
          searchParams={Promise.resolve(query)}
          basePath={paths.dashboard}
        />
      </Suspense>
    ) : undefined;
  return (
    <div className="dashboard-page">
      <header
        className={`dashboard-welcome ${user.role === "INSTRUCTOR" ? "instructor-welcome" : ""}`}
      >
        <div>
          <h1>{overviewTitles[user.role]}</h1>
        </div>
        <Link
          className="reference-button"
          href={
            user.role === "STUDENT"
              ? "#learning-continue"
              : user.role === "INSTRUCTOR"
                ? "/dashboard/instructor/courses"
                : "/dashboard/admin/users"
          }
        >
          <BookOpen size={17} aria-hidden="true" />
          {user.role === "STUDENT"
            ? "Việc học của bạn"
            : user.role === "INSTRUCTOR"
              ? "Quản lý khóa học"
              : "Quản lý người dùng"}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </header>
      <Suspense fallback={<p role="status">Đang tải dữ liệu tổng quan…</p>}>
        <DashboardOverview role={user.role} catalog={catalog} />
      </Suspense>
    </div>
  );
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return (
    <Suspense fallback={<p>Đang kiểm tra phiên…</p>}>
      <ProtectedOverview searchParams={searchParams} />
    </Suspense>
  );
}
