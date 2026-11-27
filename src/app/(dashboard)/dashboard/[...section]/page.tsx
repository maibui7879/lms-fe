import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DashboardSection } from "@/components/layout/dashboard-section";
import { getDashboardRoute } from "@/route";
import { requireUser } from "@/lib/require-user";

async function Section({ params }: { params: Promise<{ section: string[] }> }) {
  const { section } = await params;
  const href = `/dashboard/${section.join("/")}`;
  const route = getDashboardRoute(href);
  if (!route) notFound();
  if (!route.public) await requireUser(href, route.roles);
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
