"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import {
  canAccessDashboardRoute,
  getDashboardNavigation,
  getDashboardRoute,
  overviewTitles,
  paths,
} from "@/route";

export function DashboardSection({
  href = paths.dashboard,
}: {
  href?: string;
}) {
  const session = useAuthStore((state) => state.session);
  const role = session?.user.role ?? null;
  const navigation = getDashboardNavigation(role);
  const item = getDashboardRoute(href);
  const allowed = !!item && canAccessDashboardRoute(item, role);
  const isOverview = href === paths.dashboard;
  const title = !allowed
    ? "Không thể mở trang này"
    : isOverview
      ? role
        ? overviewTitles[role]
        : "Tổng quan"
      : item?.title;
  const Icon = item?.icon || LayoutDashboard;

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-heading">
        <h1>{title}</h1>
        {!allowed && (
          <p>Đăng nhập bằng tài khoản có quyền phù hợp để tiếp tục.</p>
        )}
      </div>
      {!allowed ? (
        <Link
          href={session ? paths.dashboard : paths.login}
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
            <h2 id="dashboard-start-title">Điều hướng</h2>
          </div>
          <div className="dashboard-destination-list">
            {navigation
              .filter((entry) => entry.href !== paths.dashboard)
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
              <Link href={paths.login} className="dashboard-destination">
                <span className="dashboard-destination-icon">
                  <BookOpen size={21} aria-hidden="true" />
                </span>
                <span className="dashboard-destination-copy">
                  <strong>Đăng nhập tài khoản</strong>
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
          <Link href={paths.dashboard} className="dashboard-text-link">
            Về tổng quan <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  );
}
