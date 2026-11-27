"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-[50vh] place-items-center gap-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Đã xảy ra lỗi</h1>
        <p className="mt-2 text-zinc-600">{error.message}</p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-black px-4 py-2 text-white"
      >
        Thử lại
      </button>
    </main>
  );
}
