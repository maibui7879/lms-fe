import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientSession, UserRole } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { MainLayout } from "./main-layout";
import { DashboardSection } from "./dashboard-section";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

function signIn(role: UserRole) {
  useAuthStore.setState({
    loading: false,
    session: {
      user: {
        id: "user-1",
        email: "person@example.test",
        role,
        status: "ACTIVE",
      },
    } satisfies ClientSession,
  });
}

beforeEach(() => useAuthStore.setState({ session: null, loading: false }));
afterEach(() => {
  cleanup();
  useAuthStore.setState({ session: null, loading: false });
  vi.restoreAllMocks();
});

describe("Dashboard role navigation", () => {
  it("opens the header search with Ctrl+K and searches within the signed-in dashboard", async () => {
    signIn("STUDENT");
    render(<MainLayout>Trang học</MainLayout>);
    expect(
      screen.getByRole("search", { name: "Tìm kiếm khóa học" }),
    ).toHaveAttribute("action", "/dashboard");
    await userEvent.setup().keyboard("{Control>}k{/Control}");
    expect(
      screen.getByRole("searchbox", { name: "Tìm khóa học" }),
    ).toHaveFocus();
  });
  it("shows a student's learning menu without teaching or administration", () => {
    signIn("STUDENT");
    render(
      <MainLayout>
        <h1>Trang học</h1>
      </MainLayout>,
    );
    const nav = within(
      screen.getByRole("navigation", { name: "Điều hướng chính" }),
    );
    expect(
      nav.getByRole("link", { name: "Khóa học của tôi" }),
    ).toBeInTheDocument();
    expect(
      nav.queryByRole("link", { name: "Quản lý khóa học" }),
    ).not.toBeInTheDocument();
    expect(
      nav.queryByRole("link", { name: "Quản lý người dùng" }),
    ).not.toBeInTheDocument();
    expect(nav.getByRole("link", { name: "Tổng quan" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("shows only the instructor workspace for an instructor", () => {
    signIn("INSTRUCTOR");
    render(<MainLayout>Trang giảng viên</MainLayout>);
    const nav = within(
      screen.getByRole("navigation", { name: "Điều hướng chính" }),
    );
    expect(
      nav.getByRole("link", { name: "Quản lý khóa học" }),
    ).toBeInTheDocument();
    expect(nav.getByRole("link", { name: "Hỏi đáp" })).toBeInTheDocument();
    expect(
      nav.queryByRole("link", { name: "Khóa học của tôi" }),
    ).not.toBeInTheDocument();
    expect(
      nav.queryByRole("link", { name: "Quản lý người dùng" }),
    ).not.toBeInTheDocument();
  });

  it("shows administration without student and instructor menus", () => {
    signIn("ADMIN");
    render(<MainLayout>Trang quản trị</MainLayout>);
    const nav = within(
      screen.getByRole("navigation", { name: "Điều hướng chính" }),
    );
    expect(
      nav.getByRole("link", { name: "Quản lý người dùng" }),
    ).toBeInTheDocument();
    expect(
      nav.getByRole("link", { name: "Duyệt khóa học" }),
    ).toBeInTheDocument();
    expect(
      nav.queryByRole("link", { name: "Quản lý khóa học" }),
    ).not.toBeInTheDocument();
    expect(
      nav.queryByRole("link", { name: "Bài kiểm tra" }),
    ).not.toBeInTheDocument();
  });

  it("does not assign a protected role when signed out", () => {
    render(<MainLayout>Trang khách</MainLayout>);
    const nav = within(
      screen.getByRole("navigation", { name: "Điều hướng chính" }),
    );
    expect(nav.getAllByRole("link")).toHaveLength(1);
    expect(
      nav.getByRole("link", { name: "Khám phá khóa học" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Thông báo" }),
    ).not.toBeInTheDocument();
  });

  it("can collapse and expand the desktop sidebar without losing accessible labels", async () => {
    signIn("INSTRUCTOR");
    const user = userEvent.setup();
    render(<MainLayout>Trang giảng viên</MainLayout>);
    await user.click(screen.getByRole("button", { name: "Thu gọn sidebar" }));
    expect(
      screen.getByRole("button", { name: "Mở rộng sidebar" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      within(
        screen.getByRole("navigation", { name: "Điều hướng chính" }),
      ).getByRole("link", { name: "Quản lý khóa học" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mở rộng sidebar" }));
    expect(
      screen.getByRole("button", { name: "Thu gọn sidebar" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("does not render an admin section for a student opening its URL", () => {
    signIn("STUDENT");
    render(<DashboardSection href="/dashboard/admin/users" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Không thể mở trang này" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Quản lý người dùng" }),
    ).not.toBeInTheDocument();
  });
});
