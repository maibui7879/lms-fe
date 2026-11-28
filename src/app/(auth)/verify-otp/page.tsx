import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { OtpForm } from "@/features/auth/components/otp-form";

export const metadata: Metadata = {
  title: "Xác thực OTP | Lumina LMS",
  description: "Nhập mã OTP 6 chữ số để kích hoạt tài khoản Lumina LMS",
};

export default function VerifyOtpPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <OtpForm />
      </Suspense>
    </AuthLayout>
  );
}
