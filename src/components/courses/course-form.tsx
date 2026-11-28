"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { courseService } from "@/services/course.service";
import { paths } from "@/route/paths";
import { ApiClientError } from "@/lib/api-client";

export function CourseForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    if (!title || !description) {
      setError("Nhập tên và mô tả khóa học.");
      return;
    }
    const subtitle = String(form.get("subtitle") ?? "").trim();
    const category = String(form.get("category") ?? "").trim();
    const thumbnailUrl = String(form.get("thumbnailUrl") ?? "").trim();
    if (thumbnailUrl && !/^https?:\/\//i.test(thumbnailUrl)) {
      setError("URL ảnh phải bắt đầu bằng http:// hoặc https://.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const course = await courseService.createCourse({
        title,
        description,
        descriptionFormat: "PLAIN_TEXT",
        ...(subtitle ? { subtitle } : {}),
        ...(category ? { category } : {}),
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
      });
      router.replace(
        `${paths.instructorCourses}?created=${encodeURIComponent(course.id)}`,
      );
      router.refresh();
    } catch (failure) {
      setError(
        failure instanceof ApiClientError && failure.status === 403
          ? "Tài khoản chưa có quyền tạo khóa học. Kiểm tra trạng thái giảng viên."
          : failure instanceof Error
            ? failure.message
            : "Không thể tạo khóa học. Vui lòng thử lại.",
      );
      setPending(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="course-form"
      aria-label="Thông tin khóa học"
    >
      <fieldset disabled={pending}>
        <legend>Thông tin khóa học</legend>
        <label htmlFor="course-title">
          Tên khóa học <span aria-hidden="true">*</span>
        </label>
        <input id="course-title" name="title" required maxLength={200} />
        <label htmlFor="course-subtitle">Mô tả ngắn</label>
        <input id="course-subtitle" name="subtitle" maxLength={300} />
        <label htmlFor="course-description">
          Mô tả khóa học <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="course-description"
          name="description"
          required
          rows={7}
        />
        <div className="course-form-columns">
          <div>
            <label htmlFor="course-category">Danh mục</label>
            <input id="course-category" name="category" maxLength={100} />
          </div>
          <div>
            <label htmlFor="course-thumbnail">URL ảnh bìa</label>
            <input
              id="course-thumbnail"
              name="thumbnailUrl"
              type="url"
              placeholder="https://"
            />
          </div>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
      <div className="course-form-actions">
        <Link href={paths.instructorCourses}>Hủy</Link>
        <button type="submit" disabled={pending} className="course-action">
          {pending ? "Đang lưu…" : "Lưu bản nháp"}
        </button>
      </div>
    </form>
  );
}
