import { MainLayout } from "@/components/layout/main-layout";
import { Suspense } from "react";
import { requireUser } from "@/lib/require-user";
import { paths } from "@/route/paths";
import Loading from "@/app/loading";

async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser(paths.dashboard);
  return <MainLayout>{children}</MainLayout>;
}

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<Loading />}>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  );
}
