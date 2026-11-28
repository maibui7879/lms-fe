"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError } from "@/lib/api-client";
import { safeReturnPath } from "@/lib/auth-path";
import { authService } from "@/services/auth.service";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";

function mapLoginError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) {
      return "Email hoặc mật khẩu không chính xác.";
    }
    if (error.status === 403 || error.code === "ACCOUNT_INACTIVE") {
      return "Tài khoản chưa kích hoạt hoặc đang bị khóa.";
    }
    return error.message || "Đăng nhập thất bại. Vui lòng thử lại.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onTouched",
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login({
        email: values.email.trim(),
        password: values.password,
      });
      const nextPath = safeReturnPath(searchParams.get("next"));
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setError("root.server", {
        type: "server",
        message: mapLoginError(error),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 rounded-xl bg-[#eef2ff] p-1 text-sm font-medium">
        <span
          aria-current="page"
          className="flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-slate-900 shadow-xs"
        >
          <LogIn className="h-4 w-4 text-slate-700" aria-hidden="true" />
          <span>Đăng nhập (Sign In)</span>
        </span>
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-[#2563eb] transition hover:bg-white/60"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          <span>Đăng ký mới (Register)</span>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Đăng nhập
        </h1>
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
          <svg className="h-4 w-4 text-slate-900" aria-hidden="true" />
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

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
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

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-800"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
          {errors.password && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-0.5 text-sm">
          <label
            htmlFor="rememberMe"
            className="inline-flex cursor-pointer items-center gap-2 text-slate-600"
          >
            <input
              id="rememberMe"
              type="checkbox"
              {...register("rememberMe")}
              className="h-4 w-4 rounded border-slate-300 text-[#0284c7] focus:ring-[#38bdf8]"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>

          <Link
            href="/forgot-password"
            className="font-medium text-[#0284c7] hover:underline"
          >
            Quên mật khẩu?
          </Link>
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
          <span>{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#0284c7] hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
