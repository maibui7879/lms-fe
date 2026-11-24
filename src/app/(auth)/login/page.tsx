import type { Metadata } from "next";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Đăng nhập</h1>
    </main>
  );
}
