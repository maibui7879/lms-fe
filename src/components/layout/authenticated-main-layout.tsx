import { Suspense, type ReactNode } from "react";
import { MainLayout } from "./main-layout";
import { requireUser } from "@/lib/require-user";
import { paths } from "@/route/paths";
import Loading from "@/app/loading";

async function AuthenticatedContent({ children }: { children: ReactNode }) {
  await requireUser(paths.dashboard);
  return <MainLayout>{children}</MainLayout>;
}

export function AuthenticatedMainLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </Suspense>
  );
}
