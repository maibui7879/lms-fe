import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { PasswordResetForm } from "@/features/auth/components/password-reset-form";

export const metadata: Metadata = {
  title: "Quên mật khẩu | Lumina LMS",
  description: "Khôi phục mật khẩu tài khoản Lumina LMS qua mã xác thực OTP",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <PasswordResetForm />
    </AuthLayout>
  );
}
