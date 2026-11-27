import type { Metadata } from "next";
import { DashboardSection } from "@/components/layout/dashboard-section";
import { Suspense } from "react";
import { requireUser } from "@/lib/require-user";

export const metadata: Metadata = { title: "Tổng quan" };

async function ProtectedOverview() {
  await requireUser("/dashboard");
  return <DashboardSection />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Đang kiểm tra phiên…</p>}>
      <ProtectedOverview />
    </Suspense>
  );
}
