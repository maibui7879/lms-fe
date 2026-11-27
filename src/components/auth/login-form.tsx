"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, GraduationCap } from "lucide-react";
import { useAuth } from "./auth-provider";
import { safeReturnPath } from "@/lib/auth-path";

const schema = z.object({
  email: z.string().email("Nhập email hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
});

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-heading">
        <div className="auth-brand">
          <GraduationCap size={27} aria-hidden="true" />
          <span>Lumina LMS</span>
        </div>
        <h1 id="login-heading">Đăng nhập</h1>
        <p>Tiếp tục học tập và quản lý khóa học của bạn.</p>
        <form
          onSubmit={handleSubmit(async (input) => {
            setError(null);
            try {
              await login(input);
              router.replace(safeReturnPath(params.get("next")));
              router.refresh();
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : "Không thể đăng nhập",
              );
            }
          })}
          noValidate
        >
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            autoFocus
            {...register("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
          />
          {errors.email && (
            <p id="login-email-error" className="auth-error">
              {errors.email.message}
            </p>
          )}
          <label htmlFor="login-password">Mật khẩu</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password ? "login-password-error" : undefined
            }
          />
          {errors.password && (
            <p id="login-password-error" className="auth-error">
              {errors.password.message}
            </p>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </form>
      </section>
    </main>
  );
}
