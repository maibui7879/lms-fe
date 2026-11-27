import type { ReactNode } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  ArrowRight,
  Award,
  GraduationCap,
  CheckCircle2,
  LibraryBig,
  Users,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { dashboardServer } from "@/services/dashboard.server";
import { courseService } from "@/services/course.service";
import { getDashboardNavigation, paths } from "@/route";
import { CourseCover } from "@/components/courses/course-cover";
import type { UserRole } from "@/lib/types";

const statusLabels: Record<string, string> = {
  DRAFT: "Bản nháp",
  IN_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  REJECTED: "Cần chỉnh sửa",
  NOT_STARTED: "Chưa bắt đầu",
  IN_PROGRESS: "Đang học",
  COMPLETED: "Đã hoàn thành",
  OUTDATED: "Nội dung đã cập nhật",
  RESET: "Cần học lại",
};

function StatTile({
  label,
  value,
  note,
  icon: Icon,
  tone = "cyan",
}: {
  label: string;
  value: ReactNode;
  note?: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <article className={`overview-stat stat-${tone}`}>
      <div className="overview-stat-top">
        <h2>{label}</h2>
        <span>
          <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
        </span>
      </div>
      <strong>{value}</strong>
      {note && <p>{note}</p>}
    </article>
  );
}

export function DashboardShortcuts({ role }: { role: UserRole }) {
  return (
    <nav className="dashboard-rail-links" aria-label="Công việc của bạn">
      {getDashboardNavigation(role)
        .filter((item) => item.href !== paths.dashboard)
        .map(({ href, title, icon: Icon }) => (
          <Link href={href} key={href}>
            <Icon size={16} aria-hidden="true" />
            {title}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        ))}
    </nav>
  );
}

async function StudentOverview({ catalog }: { catalog?: ReactNode }) {
  const data = await dashboardServer.student();
  const continuing = data.courses
    .filter((course) => course.status !== "COMPLETED")
    .slice(0, 3);
  const metadata = await Promise.all(
    continuing.map((course) =>
      courseService.getCourse(course.courseId).catch(() => null),
    ),
  );
  const completed = data.courses.filter(
    (course) => course.status === "COMPLETED",
  ).length;
  const active = data.courses.filter(
    (course) => course.status === "IN_PROGRESS",
  ).length;
  const quizAverage = data.recentQuizzes.length
    ? Math.round(
        data.recentQuizzes.reduce((sum, quiz) => sum + quiz.scorePercent, 0) /
          data.recentQuizzes.length,
      )
    : null;
  return (
    <>
      <section className="overview-stat-grid" aria-label="Tổng quan học tập">
        <StatTile label="Đang tiến hành" value={active} icon={BookOpen} />
        <StatTile
          label="Đã hoàn thành"
          value={completed}
          icon={Award}
          tone="blue"
        />
        <StatTile
          label="Khóa học theo dõi"
          value={data.courses.length}
          icon={LibraryBig}
          tone="violet"
        />
        <StatTile
          label="Điểm quiz gần đây TB"
          value={quizAverage === null ? "—" : `${quizAverage}%`}
          note={
            data.recentQuizzes.length
              ? `Từ ${data.recentQuizzes.length} lượt làm gần đây`
              : "Chưa có kết quả quiz"
          }
          icon={ClipboardCheck}
          tone="orange"
        />
      </section>
      <div className="student-dashboard-grid">
        <div className="student-dashboard-main">
          <section
            id="learning-continue"
            aria-labelledby="learning-overview-title"
          >
            <div className="reference-section-heading">
              <div>
                <h2 id="learning-overview-title">
                  Tiếp tục học tập{" "}
                  <small>
                    ({data.courses.length - completed} khóa đang học)
                  </small>
                </h2>
              </div>
              <Link href="/dashboard/my-learning">Xem tất cả →</Link>
            </div>
            {continuing.length === 0 ? (
              <div className="reference-empty">
                <BookOpen size={28} aria-hidden="true" />
                <h3>Chưa có khóa học đang học</h3>
                <p>Khám phá khóa học bên dưới để bắt đầu.</p>
              </div>
            ) : (
              <ul className="learning-course-list">
                {continuing.map((course, index) => (
                  <li key={course.courseId}>
                    <CourseCover
                      src={metadata[index]?.thumbnailUrl}
                      title={course.title}
                    />
                    <div className="learning-course-copy">
                      <div className="learning-course-meta">
                        <span>
                          {metadata[index]?.category ||
                            statusLabels[course.status] ||
                            course.status}
                        </span>
                      </div>
                      <h3>
                        <Link href={paths.course(course.courseId)}>
                          {course.title}
                        </Link>
                      </h3>
                      <p>
                        {course.completedRequiredItems}/
                        {course.totalRequiredItems} nội dung bắt buộc đã hoàn
                        thành
                      </p>
                      <div className="learning-progress-heading">
                        <label htmlFor={`progress-${course.courseId}`}>
                          Tiến độ khóa học
                        </label>
                        <strong>{course.progressPercent}%</strong>
                      </div>
                      <progress
                        id={`progress-${course.courseId}`}
                        max={100}
                        value={course.progressPercent}
                      />
                      <div className="learning-course-footer">
                        <span>
                          {statusLabels[course.status] || course.status}
                        </span>
                        <Link
                          href={paths.course(course.courseId)}
                          className="reference-button"
                        >
                          Xem khóa học{" "}
                          <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {catalog}
        </div>
        <aside className="dashboard-right-rail">
          <section className="dashboard-rail-panel">
            <h2>
              <ClipboardCheck size={19} aria-hidden="true" />
              Kết quả quiz gần đây
            </h2>
            {data.recentQuizzes.length === 0 ? (
              <p className="rail-empty">
                Chưa có kết quả quiz. Kết quả sẽ xuất hiện khi bạn hoàn thành
                lượt làm.
              </p>
            ) : (
              <ul className="quiz-activity-list">
                {data.recentQuizzes.slice(0, 5).map((quiz) => (
                  <li key={quiz.attemptId}>
                    <span
                      className={`quiz-result-icon ${quiz.passed ? "is-passed" : ""}`}
                    >
                      <CheckCircle2 size={15} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>
                        {quiz.scorePercent}% ·{" "}
                        {quiz.passed ? "Đạt" : "Chưa đạt"}
                      </strong>
                      {quiz.gradedAt && (
                        <p>
                          {new Intl.DateTimeFormat("vi-VN", {
                            dateStyle: "medium",
                          }).format(new Date(quiz.gradedAt))}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="dashboard-rail-panel">
            <h2>Truy cập nhanh</h2>
            <DashboardShortcuts role="STUDENT" />
          </section>
        </aside>
      </div>
    </>
  );
}

async function InstructorOverview() {
  const [data, counts] = await Promise.all([
    dashboardServer.instructor(),
    dashboardServer.instructorCounts(),
  ]);
  return (
    <>
      <section className="overview-stat-grid" aria-label="Tổng quan giảng dạy">
        <StatTile
          label="Tổng số khóa học"
          value={data.total}
          note="Khóa học bạn quản lý"
          icon={BookOpen}
          tone="blue"
        />
        <StatTile
          label="Đã xuất bản"
          value={counts[0] ?? "—"}
          note={
            counts[0] === null
              ? "Chưa tải được dữ liệu"
              : "Khóa học đã công khai"
          }
          icon={CheckCircle2}
        />
        <StatTile
          label="Chờ duyệt"
          value={counts[1] ?? "—"}
          note={
            counts[1] === null
              ? "Chưa tải được dữ liệu"
              : "Đang trong quy trình duyệt"
          }
          icon={ShieldCheck}
          tone="orange"
        />
        <StatTile
          label="Bản nháp"
          value={counts[2] ?? "—"}
          note={
            counts[2] === null
              ? "Chưa tải được dữ liệu"
              : "Khóa học chưa gửi duyệt"
          }
          icon={LibraryBig}
          tone="violet"
        />
      </section>
      <section aria-labelledby="instructor-overview-title">
        <div className="reference-section-heading">
          <div>
            <h2 id="instructor-overview-title">
              Khóa học của bạn &amp; Tiến độ phê duyệt
            </h2>
            <p>Theo dõi trạng thái xuất bản và phê duyệt khóa học</p>
          </div>
          <Link href="/dashboard/instructor/courses">
            Tất cả ({data.total}) →
          </Link>
        </div>
        {data.items.length === 0 ? (
          <div className="reference-empty">
            <BookOpen size={28} aria-hidden="true" />
            <h3>Bạn chưa có khóa học</h3>
            <p>Các khóa học của bạn sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <ul className="instructor-course-list">
            {data.items.map((course) => (
              <li key={course.id}>
                <CourseCover src={course.thumbnailUrl} title={course.title} />
                <div className="instructor-course-copy">
                  <div>
                    <span
                      className={`dashboard-course-status status-${course.status.toLowerCase()}`}
                    >
                      {statusLabels[course.status] || course.status}
                    </span>
                    <span className="instructor-update">
                      {" "}
                      · Cập nhật{" "}
                      {new Intl.DateTimeFormat("vi-VN", {
                        dateStyle: "medium",
                      }).format(new Date(course.updatedAt))}
                    </span>
                  </div>
                  <h3>{course.title}</h3>
                  {course.subtitle && <p>{course.subtitle}</p>}
                </div>
                <Link
                  href={
                    course.status === "PUBLISHED"
                      ? paths.course(course.id)
                      : "/dashboard/instructor/courses"
                  }
                  className="reference-button reference-button-soft"
                >
                  {course.status === "PUBLISHED"
                    ? "Xem khóa học"
                    : "Quản lý khóa học"}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

async function AdminOverview() {
  const totals = await dashboardServer.admin();
  const items = [
    {
      title: "Người dùng",
      href: "/dashboard/admin/users",
      icon: Users,
      note: "Tài khoản trên hệ thống",
    },
    {
      title: "Yêu cầu giảng viên chờ duyệt",
      href: "/dashboard/admin/teacher-requests",
      icon: GraduationCap,
      note: "Yêu cầu đang chờ xử lý",
    },
    {
      title: "Khóa học chờ duyệt",
      href: "/dashboard/admin/course-approvals",
      icon: ShieldCheck,
      note: "Khóa học trong hàng đợi duyệt",
    },
  ];
  return (
    <section className="admin-overview" aria-label="Tổng quan quản lý">
      <div className="overview-stat-grid overview-stat-three">
        {items.map((item, index) => (
          <Link href={item.href} key={item.href}>
            <StatTile
              label={item.title}
              value={totals[index] ?? "—"}
              note={
                totals[index] === null ? "Chưa tải được dữ liệu" : item.note
              }
              icon={item.icon}
              tone={index === 1 ? "orange" : "cyan"}
            />
          </Link>
        ))}
      </div>
      <section className="dashboard-rail-panel">
        <h2>Công việc quản trị</h2>
        <DashboardShortcuts role="ADMIN" />
      </section>
    </section>
  );
}

export async function DashboardOverview({
  role,
  catalog,
}: {
  role: UserRole;
  catalog?: ReactNode;
}) {
  let content;
  try {
    content = await (role === "STUDENT"
      ? StudentOverview({ catalog })
      : role === "INSTRUCTOR"
        ? InstructorOverview()
        : AdminOverview());
  } catch (error) {
    unstable_rethrow(error);
    return (
      <>
        <section className="dashboard-data-section" role="alert">
          <h2>Chưa tải được dữ liệu tổng quan</h2>
          <p>
            Dịch vụ của phần này đang không khả dụng. Bạn vẫn có thể dùng menu
            và khám phá khóa học.
          </p>
        </section>
        {catalog}
      </>
    );
  }
  return (
    <>
      {content}
      {role !== "STUDENT" && catalog}
    </>
  );
}
