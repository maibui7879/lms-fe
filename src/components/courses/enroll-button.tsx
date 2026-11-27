"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { courseService } from "@/services/course.service";
import { ApiClientError } from "@/lib/api-client";
import { loginForCourse } from "@/route/paths";

export function EnrollButton({ courseId }: { courseId: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [enrolledUserId, setEnrolledUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (loading) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (!user)
    return (
      <Link href={loginForCourse(courseId)} className="shell-sign-in">
        Đăng nhập để ghi danh
      </Link>
    );
  if (user.role !== "STUDENT")
    return <p>Ghi danh khóa học dành cho tài khoản học viên.</p>;
  if (enrolledUserId === user.id)
    return <p role="status">Bạn đã ghi danh khóa học này.</p>;

  return (
    <div>
      <button
        type="button"
        className="shell-sign-in"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            await courseService.enrollInCourse(courseId);
            setEnrolledUserId(user.id);
          } catch (cause) {
            if (cause instanceof ApiClientError && cause.status === 401)
              router.push(loginForCourse(courseId));
            else if (
              cause instanceof ApiClientError &&
              cause.code === "ALREADY_ENROLLED"
            )
              setEnrolledUserId(user.id);
            else
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Không thể ghi danh. Vui lòng thử lại.",
              );
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Đang ghi danh…" : "Ghi danh khóa học"}
      </button>
      {error && (
        <p role="alert" className="auth-error mt-3">
          {error}
        </p>
      )}
    </div>
  );
}
