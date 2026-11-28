"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Lock,
  RotateCcw,
} from "lucide-react";
import { ApiClientError } from "@/lib/api-client";
import { authService } from "@/services/auth.service";
import {
  forgotPasswordEmailSchema,
  resetPasswordSchema,
  type ForgotPasswordEmailValues,
  type ResetPasswordValues,
} from "../schemas/auth.schema";

type Step = 1 | 2 | 3;

export function PasswordResetForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailForm = useForm<ForgotPasswordEmailValues>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const handleSendEmail = async (values: ForgotPasswordEmailValues) => {
    const normalized = values.email.trim();
    try {
      await authService.requestPasswordReset({ email: normalized });
      setEmail(normalized);
      setStep(2);
    } catch (error) {
      const msg =
        error instanceof ApiClientError
          ? error.message || "Không thể gửi mã xác nhận."
          : "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
      emailForm.setError("root.server", { type: "server", message: msg });
    }
  };

  const handleConfirmOtpStep = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = otp.trim();
    if (!/^\d{6}$/.test(cleaned)) {
      setOtpError("Vui lòng nhập đúng mã OTP 6 chữ số.");
      return;
    }
    setOtpError(null);
    setStep(3);
  };

  const handleResetPassword = async (values: ResetPasswordValues) => {
    try {
      await authService.resetPassword({
        email,
        otp: otp.trim(),
        newPassword: values.newPassword,
      });
      router.replace("/login?reset=1");
    } catch (error) {
      const msg =
        error instanceof ApiClientError
          ? error.message || "Mã OTP không hợp lệ hoặc đã hết hạn."
          : "Không thể đặt lại mật khẩu. Vui lòng thử lại.";
      resetForm.setError("root.server", { type: "server", message: msg });
    }
  };

  const steps: Array<{ id: Step; label: string }> = [
    { id: 1, label: "Nhập Email" },
    { id: 2, label: "Xác thực OTP" },
    { id: 3, label: "Đổi mật khẩu" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 rounded-xl bg-[#eef2ff] p-1 text-xs font-medium">
        {steps.map((item) => {
          const active = item.id === step;
          return (
            <div
              key={item.id}
              aria-current={active ? "step" : undefined}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                active
                  ? "bg-white font-semibold text-[#0284c7] shadow-xs"
                  : "text-slate-600"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  active
                    ? "bg-[#0284c7] text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {item.id}
              </span>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Quên mật khẩu?
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              Nhập email đã đăng ký để nhận mã OTP xác thực khôi phục tài khoản
              học viên hoặc giảng viên.
            </p>
          </div>

          <form
            onSubmit={emailForm.handleSubmit(handleSendEmail)}
            noValidate
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="reset-email"
                className="block text-sm font-medium text-slate-800"
              >
                Email
              </label>
              <div className="relative">
                <AtSign
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@lumina.edu.vn"
                  aria-invalid={Boolean(emailForm.formState.errors.email)}
                  {...emailForm.register("email")}
                  className="w-full rounded-lg border border-slate-200 bg-[#eef2ff]/70 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/20 aria-[invalid=true]:border-red-500"
                />
              </div>
              {emailForm.formState.errors.email && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-sky-200 bg-[#e0f2fe]/70 p-3.5 text-xs leading-relaxed text-[#0369a1]">
              <div className="flex items-start gap-2.5">
                <Info
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#0284c7]"
                  aria-hidden="true"
                />
                <p>
                  <strong className="font-semibold">Lưu ý gửi mã:</strong> Vui
                  lòng kiểm tra cả hòm thư rác (Spam) hoặc mục Quảng cáo nếu bạn
                  chưa nhận được mã xác thực sau 1 phút.
                </p>
              </div>
            </div>

            {emailForm.formState.errors.root?.server && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
              >
                {emailForm.formState.errors.root.server.message}
              </div>
            )}

            <button
              type="submit"
              disabled={emailForm.formState.isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7cc4e4] px-4 py-3 text-sm font-semibold text-slate-900 shadow-xs transition hover:bg-[#5eb5dc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                {emailForm.formState.isSubmitting
                  ? "Đang gửi mã..."
                  : "Gửi mã xác nhận"}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Xác thực mã OTP
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              Nhập mã OTP gồm 6 chữ số vừa gửi tới{" "}
              <strong className="font-semibold text-slate-900">{email}</strong>.
            </p>
          </div>

          <form
            onSubmit={handleConfirmOtpStep}
            noValidate
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="reset-otp"
                className="block text-sm font-medium text-slate-800"
              >
                Mã xác thực OTP
              </label>
              <div className="relative">
                <KeyRound
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Nhập 6 chữ số"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setOtpError(null);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-[#eef2ff]/70 py-2.5 pl-10 pr-3.5 text-sm tracking-widest text-slate-900 outline-none transition focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/20"
                />
              </div>
              {otpError && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {otpError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-medium text-slate-600 hover:text-slate-900"
              >
                Đổi email khác
              </button>
              <button
                type="button"
                onClick={() => authService.requestPasswordReset({ email })}
                className="font-semibold text-[#0284c7] hover:underline"
              >
                Gửi lại mã OTP
              </button>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7cc4e4] px-4 py-3 text-sm font-semibold text-slate-900 shadow-xs transition hover:bg-[#5eb5dc]"
            >
              <span>Tiếp tục đặt mật khẩu</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </>
      )}

      {step === 3 && (
        <>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Đặt lại mật khẩu mới
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              Tạo mật khẩu mới cho tài khoản{" "}
              <strong className="font-semibold text-slate-900">{email}</strong>.
            </p>
          </div>

          <form
            onSubmit={resetForm.handleSubmit(handleResetPassword)}
            noValidate
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-slate-800"
              >
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={Boolean(resetForm.formState.errors.newPassword)}
                  {...resetForm.register("newPassword")}
                  className="w-full rounded-lg border border-slate-200 bg-[#eef2ff]/70 py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/20 aria-[invalid=true]:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={
                    showNewPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {resetForm.formState.errors.newPassword && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirmNewPassword"
                className="block text-sm font-medium text-slate-800"
              >
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <RotateCcw
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="confirmNewPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={Boolean(
                    resetForm.formState.errors.confirmPassword,
                  )}
                  {...resetForm.register("confirmPassword")}
                  className="w-full rounded-lg border border-slate-200 bg-[#eef2ff]/70 py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/20 aria-[invalid=true]:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? "Ẩn mật khẩu xác nhận"
                      : "Hiện mật khẩu xác nhận"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {resetForm.formState.errors.confirmPassword && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {resetForm.formState.errors.root?.server && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
              >
                {resetForm.formState.errors.root.server.message}
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={resetForm.formState.isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#7cc4e4] px-4 py-3 text-sm font-semibold text-slate-900 shadow-xs transition hover:bg-[#5eb5dc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  {resetForm.formState.isSubmitting
                    ? "Đang cập nhật..."
                    : "Đổi mật khẩu"}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        </>
      )}

      <p className="text-center text-xs text-slate-600">
        Nhớ lại mật khẩu?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#0284c7] hover:underline"
        >
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}
