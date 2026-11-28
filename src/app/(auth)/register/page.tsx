import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản | Lumina LMS",
  description: "Tạo tài khoản học viên mới trên hệ thống Lumina LMS",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
