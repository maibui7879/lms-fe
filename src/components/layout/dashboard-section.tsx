"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { getDashboardNavigation, roleLabels } from "./dashboard-navigation";

export function DashboardSection({ href = "/dashboard" }: { href?: string }) {
  const session = useAuthStore((state) => state.session);
  const role = session?.user.role ?? null;
  const navigation = getDashboardNavigation(role);
  const item = navigation.find((entry) => entry.href === href);
  const commonTitle =
    href === "/dashboard/profile"
      ? "Hồ sơ tài khoản"
      : href === "/dashboard/notifications"
        ? "Thông báo"
        : null;
  const allowed = !!item || (!!session && !!commonTitle);
  const isOverview = href === "/dashboard";
  const title = !allowed
    ? "Không thể mở trang này"
    : isOverview
      ? role === "INSTRUCTOR"
        ? "Tổng quan giảng viên"
        : role === "ADMIN"
          ? "Tổng quan quản trị"
          : role === "STUDENT"
            ? "Tổng quan học tập"
            : "Chào mừng đến Lumina LMS"
      : item?.title || commonTitle;
  const Icon = item?.icon || LayoutDashboard;

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-heading">
        <span className="dashboard-eyebrow">
          <span aria-hidden="true" />
          {role ? roleLabels[role] : "Lumina LMS"}
        </span>
        <h1>{title}</h1>
        <p>
          {!allowed
            ? "Đăng nhập bằng tài khoản có quyền phù hợp để tiếp tục."
            : isOverview
              ? session
                ? "Truy cập các công việc của bạn từ menu bên trái hoặc chọn mục bên dưới."
                : "Khám phá khóa học và đăng nhập để mở không gian của bạn."
              : item?.description ||
                "Quản lý thông tin trong không gian của bạn."}
        </p>
      </div>
      {!allowed ? (
        <Link
          href={session ? "/dashboard" : "/login"}
          className="dashboard-text-link"
        >
          {session ? "Về tổng quan" : "Đăng nhập"}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      ) : isOverview ? (
        <section
          className="dashboard-start-section"
          aria-labelledby="dashboard-start-title"
        >
          <div className="dashboard-section-heading">
            <h2 id="dashboard-start-title">
              {role ? "Trong không gian của bạn" : "Bắt đầu tại đây"}
            </h2>
            <span>Chọn một mục để tiếp tục</span>
          </div>
          <div className="dashboard-destination-list">
            {navigation
              .filter((entry) => entry.href !== "/dashboard")
              .map(
                ({
                  title: label,
                  href: target,
                  description,
                  icon: ItemIcon,
                }) => (
                  <Link
                    key={target}
                    href={target}
                    className="dashboard-destination"
                  >
                    <span className="dashboard-destination-icon">
                      <ItemIcon
                        size={21}
                        strokeWidth={1.6}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="dashboard-destination-copy">
                      <strong>{label}</strong>
                      <span>{description}</span>
                    </span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                ),
              )}
            {!session && (
              <Link href="/login" className="dashboard-destination">
                <span className="dashboard-destination-icon">
                  <BookOpen size={21} aria-hidden="true" />
                </span>
                <span className="dashboard-destination-copy">
                  <strong>Đăng nhập tài khoản</strong>
                  <span>Mở không gian học tập hoặc quản lý của bạn.</span>
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            )}
          </div>
        </section>
      ) : (
        <section
          className="dashboard-section-placeholder"
          aria-label={`Nội dung ${title}`}
        >
          <span className="dashboard-placeholder-icon">
            <Icon size={28} strokeWidth={1.4} aria-hidden="true" />
          </span>
          <h2>{title}</h2>
          <p>Màn hình này đang được hoàn thiện.</p>
          <Link href="/dashboard" className="dashboard-text-link">
            Về tổng quan <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  );
}
