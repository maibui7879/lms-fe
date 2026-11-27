import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DashboardSection } from "@/components/layout/dashboard-section";
import { getDashboardNavigation } from "@/components/layout/dashboard-navigation";
import { requireUser } from "@/lib/require-user";
import type { UserRole } from "@/lib/types";

const knownPaths = new Set(
  [
    ...getDashboardNavigation(null),
    ...getDashboardNavigation("STUDENT"),
    ...getDashboardNavigation("INSTRUCTOR"),
    ...getDashboardNavigation("ADMIN"),
  ].map((item) => item.href),
);
knownPaths.add("/dashboard/profile");
knownPaths.add("/dashboard/notifications");

async function Section({ params }: { params: Promise<{ section: string[] }> }) {
  const { section } = await params;
  const href = `/dashboard/${section.join("/")}`;
  if (!knownPaths.has(href)) notFound();
  if (href !== "/dashboard/explore") {
    const roles: UserRole[] | undefined =
      section[0] === "admin"
        ? ["ADMIN"]
        : section[0] === "instructor"
          ? ["INSTRUCTOR"]
          : ["my-learning", "my-quizzes", "progress", "certificates"].includes(
                section[0],
              )
            ? ["STUDENT"]
            : undefined;
    await requireUser(href, roles);
  }
  return <DashboardSection href={href} />;
}

export default function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  return (
    <Suspense fallback={<p>Đang tải trang…</p>}>
      <Section params={params} />
    </Suspense>
  );
}
