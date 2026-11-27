"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronRight,
  GraduationCap,
  LogIn,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  LogOut,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { authService } from "@/services/auth.service";
import {
  getDashboardNavigation,
  isNavigationActive,
  roleLabels,
} from "./dashboard-navigation";

export function DashboardShell({ children }: { children: ReactNode }) {
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const mobileMenu = useRef<HTMLDialogElement>(null);
  const role = session?.user.role ?? null;
  const navigation = getDashboardNavigation(role);
  const roleLabel = role ? roleLabels[role] : "Khách";
  const displayName = session?.user.displayName || session?.user.email;
  const currentPage = navigation.find((item) =>
    isNavigationActive(pathname, item.href),
  );

  function sidebar(compact: boolean, mobile = false) {
    return (
      <>
        <div className="shell-brand-row">
          <Link
            href="/dashboard"
            className="shell-brand"
            aria-label="Lumina LMS — Tổng quan"
            onClick={() => mobileMenu.current?.close()}
          >
            <span className="shell-brand-icon">
              <GraduationCap aria-hidden="true" size={23} />
            </span>
            <span className={compact ? "sr-only" : "shell-brand-name"}>
              Lumina<span>LMS</span>
            </span>
          </Link>
          {mobile ? (
            <button
              type="button"
              className="shell-icon-button"
              aria-label="Đóng menu"
              onClick={() => mobileMenu.current?.close()}
            >
              <X size={19} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className="shell-icon-button shell-collapse"
              aria-label={compact ? "Mở rộng sidebar" : "Thu gọn sidebar"}
              aria-expanded={!compact}
              aria-controls="desktop-navigation"
              onClick={() => setCollapsed(!collapsed)}
            >
              {compact ? (
                <PanelLeftOpen size={17} aria-hidden="true" />
              ) : (
                <PanelLeftClose size={17} aria-hidden="true" />
              )}
            </button>
          )}
        </div>
        <div
          className={`shell-role-scope ${compact ? "shell-role-compact" : ""}`}
        >
          <span className={compact ? "sr-only" : ""}>Vai trò</span>
          <span className="shell-role-tag" title={roleLabel}>
            {compact ? roleLabel.charAt(0) : roleLabel}
          </span>
        </div>
        <nav
          id={mobile ? "mobile-navigation" : "desktop-navigation"}
          aria-label={
            mobile ? "Điều hướng trên điện thoại" : "Điều hướng chính"
          }
          className="shell-navigation"
        >
          <p className={compact ? "sr-only" : "shell-nav-heading"}>
            {role === "ADMIN"
              ? "Quản trị hệ thống"
              : role === "INSTRUCTOR"
                ? "Không gian giảng dạy"
                : role === "STUDENT"
                  ? "Không gian học tập"
                  : "Khám phá"}
          </p>
          <ul>
            {navigation.map(({ title, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`shell-nav-link ${isNavigationActive(pathname, href) ? "is-active" : ""}`}
                  aria-current={
                    isNavigationActive(pathname, href) ? "page" : undefined
                  }
                  title={compact ? title : undefined}
                  onClick={() => mobileMenu.current?.close()}
                >
                  <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
                  <span className={compact ? "sr-only" : ""}>{title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="shell-sidebar-footer">
          {session && (
            <button
              type="button"
              className="shell-nav-link w-full"
              title={compact ? "Đăng xuất" : undefined}
              onClick={async () => {
                try {
                  await authService.logout();
                  router.replace("/login");
                  router.refresh();
                } catch (error) {
                  setLogoutError(
                    error instanceof Error
                      ? error.message
                      : "Không thể đăng xuất. Vui lòng thử lại.",
                  );
                }
              }}
            >
              <LogOut size={19} aria-hidden="true" />
              <span className={compact ? "sr-only" : ""}>Đăng xuất</span>
            </button>
          )}
          <Link
            href={session ? "/dashboard/profile" : "/login"}
            className="shell-nav-link"
            title={
              compact ? (session ? "Hồ sơ tài khoản" : "Đăng nhập") : undefined
            }
            onClick={() => mobileMenu.current?.close()}
          >
            {session ? (
              <UserRound size={19} aria-hidden="true" />
            ) : (
              <LogIn size={19} aria-hidden="true" />
            )}
            <span className={compact ? "sr-only" : ""}>
              {session ? "Hồ sơ tài khoản" : "Đăng nhập"}
            </span>
          </Link>
          {!compact && (
            <p className="shell-footer-note">Lumina LMS · Không gian học tập</p>
          )}
        </div>
      </>
    );
  }

  return (
    <div className={`dashboard-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <a href="#dashboard-content" className="shell-skip-link">
        Đến nội dung chính
      </a>
      <aside className="shell-sidebar">{sidebar(collapsed)}</aside>
      <dialog
        ref={mobileMenu}
        className="shell-mobile-dialog"
        aria-label="Menu điều hướng"
        onCancel={(event) => {
          event.preventDefault();
          mobileMenu.current?.close();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") mobileMenu.current?.close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) mobileMenu.current?.close();
        }}
      >
        <div className="shell-mobile-sidebar">{sidebar(false, true)}</div>
      </dialog>
      <div className="shell-workspace">
        <header className="shell-header">
          <div className="shell-header-location">
            <button
              type="button"
              className="shell-icon-button shell-mobile-trigger"
              aria-label="Mở menu"
              aria-haspopup="dialog"
              onClick={() => mobileMenu.current?.showModal()}
            >
              <Menu size={21} aria-hidden="true" />
            </button>
            <span className="shell-breadcrumb-root">Không gian của bạn</span>
            <ChevronRight
              size={14}
              className="shell-breadcrumb-separator"
              aria-hidden="true"
            />
            <span className="shell-breadcrumb-current">
              {currentPage?.title ||
                (pathname === "/dashboard/profile"
                  ? "Hồ sơ tài khoản"
                  : pathname === "/dashboard/notifications"
                    ? "Thông báo"
                    : "Khóa học")}
            </span>
          </div>
          <div className="shell-header-actions">
            <span className="shell-header-role">{roleLabel}</span>
            {session ? (
              <>
                <Link
                  href="/dashboard/notifications"
                  className="shell-icon-button"
                  aria-label="Thông báo"
                >
                  <Bell size={19} aria-hidden="true" />
                </Link>
                <span className="shell-header-divider" />
                <Link
                  href="/dashboard/profile"
                  className="shell-account"
                  aria-label={`Hồ sơ tài khoản ${displayName}`}
                >
                  <span className="shell-account-copy">
                    <strong>{displayName}</strong>
                    <span>{roleLabel}</span>
                  </span>
                  <span className="shell-avatar" aria-hidden="true">
                    {displayName?.charAt(0).toUpperCase()}
                  </span>
                </Link>
              </>
            ) : (
              <Link href="/login" className="shell-sign-in">
                Đăng nhập <LogIn size={15} aria-hidden="true" />
              </Link>
            )}
          </div>
        </header>
        <main id="dashboard-content" tabIndex={-1} className="shell-content">
          {logoutError && (
            <p role="alert" className="auth-error">
              {logoutError}
            </p>
          )}
          {loading ? (
            <p role="status">Đang kiểm tra phiên đăng nhập…</p>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
