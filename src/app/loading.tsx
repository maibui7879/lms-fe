export default function Loading() {
  return (
    <div role="status" className="page-status" aria-live="polite">
      <span className="page-status-spinner" aria-hidden="true" />
      <p>Đang tải…</p>
    </div>
  );
}
