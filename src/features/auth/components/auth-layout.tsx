import type { ReactNode } from "react";
import { GraduationCap, ShieldCheck } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-slate-900">
      <aside className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-[#f8fafc] p-12 border-r border-slate-100">
        <div className="my-auto flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-sm">
            <GraduationCap className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-[#1e3a8a]">
              Lumina LMS
            </span>
          </div>
        </div>

        <div className="max-w-md rounded-xl border border-blue-100 bg-white/80 p-4 text-xs leading-relaxed text-slate-600 backdrop-blur-sm">
          <div className="flex items-start gap-2.5">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-[#0284c7]"
              aria-hidden="true"
            />
            <p>
              <strong className="font-semibold text-[#0369a1]">
                Quy định tài khoản:
              </strong>{" "}
              Mọi tài khoản mới mặc định là{" "}
              <strong className="font-semibold text-slate-800">
                Học viên (Student)
              </strong>
              . Sau khi gia nhập, bạn có thể gửi hồ sơ nâng cấp thành{" "}
              <strong className="font-semibold text-slate-800">
                Giảng viên (Teacher)
              </strong>{" "}
              bất cứ lúc nào tại trang cá nhân.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
