import { Suspense } from "react";
import { RestoreSession } from "@/components/auth/restore-session";

export default function RestorePage() {
  return (
    <Suspense fallback={<p>Đang kiểm tra phiên…</p>}>
      <RestoreSession />
    </Suspense>
  );
}
