import {
  BookOpen,
  ChartNoAxesCombined,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  MessageSquare,
  ShieldCheck,
  Users,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface NavigationItem {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export const roleLabels: Record<UserRole, string> = {
  STUDENT: "Học viên",
  INSTRUCTOR: "Giảng viên",
  ADMIN: "Quản trị viên",
};

const overview: NavigationItem = {
  title: "Tổng quan",
  href: "/dashboard",
  description: "Không gian làm việc của bạn.",
  icon: LayoutDashboard,
};

const explore: NavigationItem = {
  title: "Khám phá khóa học",
  href: "/dashboard/explore",
  description: "Tìm khóa học phù hợp với mục tiêu của bạn.",
  icon: LibraryBig,
};

const navigationByRole: Record<UserRole, NavigationItem[]> = {
  STUDENT: [
    overview,
    explore,
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

export function getDashboardNavigation(
  role: UserRole | null,
): NavigationItem[] {
  return role ? navigationByRole[role] : [overview, explore];
}

export function isNavigationActive(pathname: string, href: string): boolean {
  return (
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`))
  );
}
