"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { safeReturnPath } from "@/lib/auth-path";

export function RestoreSession() {
  const params = useSearchParams();
  const next = safeReturnPath(params.get("next"));
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    authService
      .restoreSession()
      .then((session) => {
        if (active)
          window.location.replace(
            session ? next : `/login?next=${encodeURIComponent(next)}`,
          );
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [next]);
  return (
    <main className="auth-page">
      <div className="auth-card">
        {error ? (
          <>
            <h1>Không thể khôi phục phiên</h1>
            <p>Kết nối dịch vụ tài khoản đang gặp lỗi.</p>
            <button type="button" onClick={() => window.location.reload()}>
              Thử lại
            </button>
          </>
        ) : (
          <p role="status">Đang khôi phục phiên đăng nhập…</p>
        )}
      </div>
    </main>
  );
}
