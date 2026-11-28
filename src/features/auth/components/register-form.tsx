"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  RotateCcw,
  User,
  UserPlus,
} from "lucide-react";
import { ApiClientError } from "@/lib/api-client";
import { authService } from "@/services/auth.service";
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/auth.schema";

function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  bars: number;
} {
  if (!password) return { score: 0, label: "", bars: 0 };
  let score = 0;
  if (password.length >= 8) score += 3;
  if (password.length >= 12) score += 2;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 2;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 2;
  const clamped = Math.min(score, 10);
  if (clamped <= 3)
    return { score: clamped, label: `Yếu (${clamped}/10)`, bars: 1 };
  if (clamped <= 6)
    return { score: clamped, label: `Trung bình (${clamped}/10)`, bars: 2 };
  if (clamped <= 8)
    return { score: clamped, label: `Mạnh (${clamped}/10)`, bars: 3 };
  return { score: clamped, label: `Rất mạnh (${clamped}/10)`, bars: 4 };
}

function mapRegisterError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 409) {
      return "Email này đã được đăng ký tài khoản.";
    }
    return error.message || "Đăng ký thất bại. Vui lòng thử lại.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
}

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: undefined,
    },
    mode: "onTouched",
  });

  const passwordValue = useWatch({ control, name: "password" });
  const strength = useMemo(
    () => calculatePasswordStrength(passwordValue || ""),
    [passwordValue],
  );

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const normalizedEmail = values.email.trim();
      await authService.register({
        displayName: values.displayName.trim(),
        email: normalizedEmail,
        password: values.password,
      });
      router.push(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        setError("email", { type: "server", message: mapRegisterError(error) });
        return;
      }
      setError("root.server", {
        type: "server",
        message: mapRegisterError(error),
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-xl bg-[#eef2ff] p-1 text-sm font-medium">
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-slate-600 transition hover:bg-white/60"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          <span>Đăng nhập (Sign In)</span>
        </Link>
        <span
          aria-current="page"
          className="flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-[#0284c7] shadow-xs"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          <span>Đăng ký mới (Register)</span>
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Tạo tài khoản học viên mới
        </h1>
        <p className="text-sm text-slate-500">
          Gia nhập cộng đồng hơn 50.000 học viên tại Lumina LMS để bắt đầu hành
          trình học tập.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={authService.getOAuthUrl("google")}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.79 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.91 6.16-4.91z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.09C2.99 19.53 7.7 23 12 23z"
            />
          </svg>
          <span>Google</span>
        </a>

        <a
          href={authService.getOAuthUrl("github")}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <svg
            className="h-4 w-4 fill-slate-900"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span>GitHub / Dev</span>
        </a>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-slate-200" />
        <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
          Hoặc bằng email
        </span>
        <div className="w-full border-t border-slate-200" />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-3.5"
      >
        <div className="space-y-1">
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-slate-800"
          >
            Họ và tên đầy đủ
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              aria-invalid={Boolean(errors.displayName)}
              {...register("displayName")}
              className="w-full rounded-lg border border-slate-200 bg-[#eef2ff]/70 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/20 aria-[invalid=true]:border-red-500"
            />
          </div>
          {errors.displayName && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {errors.displayName.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-800"
          >
            Email học tập
          </label>
          <div className="relative">
            <AtSign
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@lumina.edu.vn"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
              className="w-full rounded-lg border border-slate-200 bg-[#eef2ff]/70 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/20 aria-[invalid=true]:border-red-500"
            />
          </div>
          {errors.email && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-800"
            >
              Mật khẩu
            </label>
            {strength.label && (
              <span className="text-xs font-semibold text-[#0284c7]">
                {strength.label}
              </span>
            )}
          </div>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
              className="w-full rounded-lg border border-slate-200 bg-[#eef2ff]/70 py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/20 aria-[invalid=true]:border-red-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5 pt-1" aria-hidden="true">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1 rounded-full transition-colors ${
                  step <= strength.bars ? "bg-[#5eb5dc]" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          {errors.password && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-800"
          >
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <RotateCcw
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register("confirmPassword")}
              className="w-full rounded-lg border border-slate-200 bg-[#eef2ff]/70 py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/20 aria-[invalid=true]:border-red-500"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              aria-label={
                showConfirm ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1 pt-0.5">
          <label
            htmlFor="acceptTerms"
            className="inline-flex cursor-pointer items-start gap-2 text-xs text-slate-600"
          >
            <input
              id="acceptTerms"
              type="checkbox"
              {...register("acceptTerms")}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0284c7] focus:ring-[#38bdf8]"
            />
            <span>
              Tôi đồng ý với{" "}
              <span className="font-semibold text-[#0284c7]">
                Điều khoản dịch vụ
              </span>{" "}
              và{" "}
              <span className="font-semibold text-[#0284c7]">
                Chính sách bảo mật
              </span>{" "}
              của Lumina LMS.
            </span>
          </label>
          {errors.acceptTerms && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        {errors.root?.server && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
          >
            {errors.root.server.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#7cc4e4] px-4 py-3 text-sm font-semibold text-slate-900 shadow-xs transition hover:bg-[#5eb5dc] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>
            {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản học viên"}
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Đã có tài khoản Lumina?{" "}
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
