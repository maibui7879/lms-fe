"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Search,
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
  getDashboardRoute,
  isNavigationActive,
  roleLabels,
  paths,
} from "@/route";

export function MainLayout({ children }: { children: ReactNode }) {
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const mobileMenu = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const role = session?.user.role ?? null;
  const navigation = getDashboardNavigation(role);
  const roleLabel = role ? roleLabels[role] : "Khách";
  const displayName = session?.user.displayName || session?.user.email;
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const input =
          searchInput.current ?? document.getElementById("course-search");
        input?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function sidebar(compact: boolean, mobile = false) {
    return (
      <>
        <div className="shell-brand-row">
          <Link
            href={session ? paths.dashboard : paths.explore}
            className="shell-brand"
            aria-label={
              session
                ? "Lumina LMS — Tổng quan"
                : "Lumina LMS — Khám phá khóa học"
            }
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
        <nav
          id={mobile ? "mobile-navigation" : "desktop-navigation"}
          aria-label={
            mobile ? "Điều hướng trên điện thoại" : "Điều hướng chính"
          }
          className="shell-navigation"
        >
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
                  router.replace(paths.login);
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
            href={session ? paths.profile : paths.login}
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
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <div className="dashboard-shell guest-shell">
        <a href="#dashboard-content" className="shell-skip-link">
          Đến nội dung chính
        </a>
        <header className="shell-header guest-header">
          <Link
            href={paths.explore}
            className="shell-brand"
            aria-label="Lumina LMS — Khám phá khóa học"
          >
            <GraduationCap size={25} aria-hidden="true" />
            <span className="shell-brand-name">
              Lumina<span>LMS</span>
            </span>
          </Link>
          <nav aria-label="Điều hướng khách" className="guest-header-nav">
            <Link
              href={`${paths.explore}#catalog`}
              className="guest-courses-link"
            >
              Khóa học
            </Link>
            <Link href={paths.login} className="shell-sign-in">
              Đăng nhập <LogIn size={16} aria-hidden="true" />
            </Link>
          </nav>
        </header>
        <main
          id="dashboard-content"
          tabIndex={-1}
          className="shell-content guest-content"
        >
          {loading && !getDashboardRoute(pathname)?.public ? (
            <p role="status">Đang kiểm tra phiên đăng nhập…</p>
          ) : (
            children
          )}
        </main>
      </div>
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
            <form
              role="search"
              aria-label="Tìm kiếm khóa học"
              className="shell-header-search"
              action={session ? paths.dashboard : paths.explore}
              method="get"
            >
              <Search size={16} aria-hidden="true" />
              <label htmlFor="header-course-search" className="sr-only">
                Tìm khóa học
              </label>
              <input
                ref={searchInput}
                id="header-course-search"
                name="search"
                type="search"
                placeholder="Tìm kiếm khóa học…"
                maxLength={200}
              />
              <button type="submit" aria-label="Tìm khóa học">
                <kbd>⌘ K</kbd>
                <Search
                  className="shell-search-submit-icon"
                  size={15}
                  aria-hidden="true"
                />
              </button>
            </form>
          </div>
          <div className="shell-header-actions">
            <details className="shell-help">
              <summary aria-label="Trợ giúp">
                <CircleHelp size={19} aria-hidden="true" />
              </summary>
              <div>
                <strong>Trợ giúp</strong>
                <p>
                  Tìm kiếm khóa học từ thanh tìm kiếm. Đăng nhập bằng tài khoản
                  học viên để ghi danh và theo dõi việc học.
                </p>
              </div>
            </details>
            {session ? (
              <>
                <Link
                  href={paths.notifications}
                  className="shell-icon-button"
                  aria-label="Thông báo"
                >
                  <Bell size={19} aria-hidden="true" />
                </Link>
                <span className="shell-header-divider" />
                <Link
                  href={paths.profile}
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
                  <ChevronDown size={14} aria-hidden="true" />
                </Link>
              </>
            ) : (
              <Link href={paths.login} className="shell-sign-in">
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
          {loading && !getDashboardRoute(pathname)?.public ? (
            <p role="status">Đang kiểm tra phiên đăng nhập…</p>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
