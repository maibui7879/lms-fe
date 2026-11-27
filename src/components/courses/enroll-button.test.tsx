import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EnrollButton } from "./enroll-button";
import { courseService } from "@/services/course.service";
import { useAuth } from "@/components/auth/auth-provider";
import { loginForCourse } from "@/route/paths";

vi.mock("@/components/auth/auth-provider", () => ({ useAuth: vi.fn() }));
vi.mock("@/services/course.service", () => ({
  courseService: { enrollInCourse: vi.fn() },
}));
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(cleanup);
function session(role: "STUDENT" | "INSTRUCTOR" | null) {
  vi.mocked(useAuth).mockReturnValue({
    user: role ? { id: "user-1", email: "user@example.test", role } : null,
    loading: false,
  } as ReturnType<typeof useAuth>);
}

it("asks guests to log in with a return URL without attempting enrollment", () => {
  session(null);
  render(<EnrollButton courseId="course-1" />);
  expect(
    screen.getByRole("link", { name: "Đăng nhập để ghi danh" }),
  ).toHaveAttribute("href", loginForCourse("course-1"));
  expect(courseService.enrollInCourse).not.toHaveBeenCalled();
});

it("enrolls only after a signed-in student confirms", async () => {
  session("STUDENT");
  vi.mocked(courseService.enrollInCourse).mockResolvedValue({});
  render(<EnrollButton courseId="course-1" />);
  expect(courseService.enrollInCourse).not.toHaveBeenCalled();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Ghi danh khóa học" }));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Bạn đã ghi danh khóa học này.",
  );
  expect(courseService.enrollInCourse).toHaveBeenCalledExactlyOnceWith(
    "course-1",
  );
});

it("does not offer student enrollment to instructors", () => {
  session("INSTRUCTOR");
  render(<EnrollButton courseId="course-1" />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(courseService.enrollInCourse).not.toHaveBeenCalled();
});
