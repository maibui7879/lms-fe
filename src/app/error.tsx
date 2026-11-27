"use client";

import Link from "next/link";

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="page-status">
      <h1>Không thể tải trang</h1>
      <div className="page-status-actions">
        <button type="button" onClick={retry} className="page-status-action">
          Thử lại
        </button>
        <Link className="page-status-link" href="/">
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
