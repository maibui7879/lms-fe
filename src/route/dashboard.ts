import {
  BookOpen,
  ChartNoAxesCombined,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Users,
  UserRoundCheck,
  UserRound,
  Bell,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types";
import { paths } from "./paths";

export interface NavigationItem {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export interface DashboardRoute extends NavigationItem {
  public?: boolean;
  roles?: readonly UserRole[];
  sidebarRoles?: readonly UserRole[];
  guestSidebar?: boolean;
}

export const roleLabels: Record<UserRole, string> = {
  STUDENT: "Học viên",
  INSTRUCTOR: "Giảng viên",
  ADMIN: "Quản trị viên",
};

const overview: NavigationItem = {
  title: "Tổng quan",
  href: paths.dashboard,
  description: "Không gian làm việc của bạn.",
  icon: LayoutDashboard,
};

const navigationByRole: Record<UserRole, NavigationItem[]> = {
  STUDENT: [
    overview,
    {
      title: "Khóa học của tôi",
      href: "/dashboard/my-learning",
      description: "Các khóa học bạn đã ghi danh.",
      icon: BookOpen,
    },
    {
      title: "Bài kiểm tra",
      href: "/dashboard/my-quizzes",
      description: "Lượt làm bài và kết quả của bạn.",
      icon: ClipboardCheck,
    },
    {
      title: "Tiến độ học tập",
      href: "/dashboard/progress",
      description: "Theo dõi quá trình học và hoàn thành bài.",
      icon: ChartNoAxesCombined,
    },
    {
      title: "Chứng chỉ",
      href: "/dashboard/certificates",
      description: "Chứng chỉ các khóa học đã hoàn thành.",
      icon: GraduationCap,
    },
  ],
  INSTRUCTOR: [
    overview,
    {
      title: "Quản lý khóa học",
      href: "/dashboard/instructor/courses",
      description: "Soạn giáo trình và theo dõi trạng thái duyệt khóa học.",
      icon: BookOpen,
    },
    {
      title: "Học viên",
      href: "/dashboard/instructor/learners",
      description: "Học viên trong các khóa học bạn giảng dạy.",
      icon: Users,
    },
    {
      title: "Quản lý quiz",
      href: "/dashboard/instructor/quizzes",
      description: "Soạn câu hỏi và quản lý bài kiểm tra.",
      icon: ClipboardCheck,
    },
    {
      title: "Hỏi đáp",
      href: "/dashboard/instructor/discussions",
      description: "Trao đổi với học viên theo khóa học.",
      icon: MessageSquare,
    },
    {
      title: "Báo cáo học tập",
      href: "/dashboard/instructor/reports",
      description: "Kết quả và tiến độ học viên trong khóa học của bạn.",
      icon: ChartNoAxesCombined,
    },
  ],
  ADMIN: [
    overview,
    {
      title: "Quản lý người dùng",
      href: "/dashboard/admin/users",
      description: "Quản lý tài khoản và vai trò người dùng.",
      icon: Users,
    },
    {
      title: "Yêu cầu giảng viên",
      href: "/dashboard/admin/teacher-requests",
      description: "Xem xét yêu cầu trở thành giảng viên.",
      icon: UserRoundCheck,
    },
    {
      title: "Duyệt khóa học",
      href: "/dashboard/admin/course-approvals",
      description: "Xem và duyệt khóa học trước khi công khai.",
      icon: ShieldCheck,
    },
    {
      title: "Thống kê ghi danh",
      href: "/dashboard/admin/enrollments",
      description: "Theo dõi lượt ghi danh khóa học.",
      icon: ChartNoAxesCombined,
    },
  ],
};

// Each menu item is declared above once. Derive access rules from the same
// role groups so sidebar and server guards cannot drift apart.
const sidebarRoutes = new Map<string, DashboardRoute>();
for (const role of Object.keys(navigationByRole) as UserRole[]) {
  for (const item of navigationByRole[role]) {
    const existing = sidebarRoutes.get(item.href);
    const roles = [...(existing?.sidebarRoles ?? []), role];
    sidebarRoutes.set(item.href, {
      ...item,
      roles,
      sidebarRoles: roles,
    });
  }
}

export const dashboardRoutes: readonly DashboardRoute[] = [
  ...sidebarRoutes.values(),
  {
    title: "Hồ sơ tài khoản",
    href: paths.profile,
    description: "Quản lý thông tin tài khoản của bạn.",
    icon: UserRound,
  },
  {
    title: "Thông báo",
    href: paths.notifications,
    description: "Thông báo dành cho tài khoản của bạn.",
    icon: Bell,
  },
];

export const overviewTitles: Record<UserRole, string> = {
  STUDENT: "Tổng quan học tập",
  INSTRUCTOR: "Tổng quan giảng viên",
  ADMIN: "Tổng quan quản trị",
};

export const courseDetailRoute: DashboardRoute = {
  title: "Khóa học",
  href: "/dashboard/courses/[courseId]",
  description: "Nội dung khóa học.",
  icon: BookOpen,
};

export function getDashboardRoute(href: string) {
  return (
    dashboardRoutes.find((route) => route.href === href) ??
    (/^\/dashboard\/courses\/[^/]+$/.test(href) ? courseDetailRoute : undefined)
  );
}

export function canAccessDashboardRoute(
  route: DashboardRoute,
  role: UserRole | null,
) {
  return !!role && (!route.roles || route.roles.includes(role));
}

export function getDashboardNavigation(
  role: UserRole | null,
): readonly DashboardRoute[] {
  return dashboardRoutes.filter((route) =>
    role ? route.sidebarRoles?.includes(role) : route.guestSidebar,
  );
}

export function isNavigationActive(pathname: string, href: string): boolean {
  return (
    pathname === href ||
    (href !== paths.dashboard && pathname.startsWith(`${href}/`))
  );
}
