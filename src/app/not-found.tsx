import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-status">
      <h1>404 — Không tìm thấy trang</h1>
      <Link className="page-status-action" href="/">
        Về trang chủ
      </Link>
    </main>
  );
}
