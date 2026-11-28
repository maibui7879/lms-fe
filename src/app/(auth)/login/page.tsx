import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Đăng nhập | Lumina LMS",
  description: "Đăng nhập vào hệ thống quản lý học tập Lumina LMS",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
