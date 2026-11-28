"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { ApiClientError } from "@/lib/api-client";
import { authService } from "@/services/auth.service";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(
    0,
    Math.min(6, Math.max(1, Math.floor(local.length / 2))),
  );
  return `${visible}***@${domain}`;
}

export function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleChangeDigit = (index: number, rawValue: string) => {
    const cleaned = rawValue.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    const next = [...digits];
    cleaned
      .slice(0, 6 - index)
      .split("")
      .forEach((char, offset) => {
        next[index + offset] = char;
      });
    setDigits(next);
    setErrorMessage(null);

    const nextIndex = Math.min(index + cleaned.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, idx) => {
      next[idx] = char;
    });
    setDigits(next);
    setErrorMessage(null);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email) {
      setErrorMessage("Thiếu địa chỉ email xác thực. Vui lòng đăng ký lại.");
      return;
    }

    const otp = digits.join("");
    if (otp.length !== 6) {
      setErrorMessage("Vui lòng nhập đầy đủ 6 chữ số OTP.");
      return;
    }

    setSubmitting(true);
    try {
      await authService.verifyEmail({ email, otp });
      router.replace("/login?verified=1");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(
          error.message || "Mã OTP không chính xác hoặc đã hết hạn.",
        );
      } else {
        setErrorMessage("Không thể xác thực OTP. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setResending(true);
    try {
      await authService.resendOtp({ email });
      setCooldown(60);
      setInfoMessage("Đã gửi lại mã xác thực OTP mới.");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message || "Không thể gửi lại mã OTP.");
      } else {
        setErrorMessage("Không thể gửi lại mã OTP. Vui lòng thử lại.");
      }
    } finally {
      setResending(false);
    }
  };

  const formattedTimer = `00:${String(cooldown).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e0f2fe] text-[#0284c7]">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Nhập mã xác thực OTP
          </h1>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          Mã xác thực gồm 6 chữ số đã được gửi đến email{" "}
          <strong className="font-semibold text-slate-900">
            {email ? maskEmail(email) : "của bạn"}
          </strong>
          . Vui lòng kiểm tra hòm thư chính hoặc thư rác.
        </p>
      </div>

      <form onSubmit={handleVerify} noValidate className="space-y-5">
        <fieldset>
          <legend className="sr-only">Mã xác thực OTP 6 chữ số</legend>
          <div className="grid grid-cols-6 gap-2.5 sm:gap-3">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                aria-label={`Chữ số OTP thứ ${index + 1}`}
                value={digit}
                onChange={(e) => handleChangeDigit(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="h-14 w-full rounded-xl border-2 border-slate-200 bg-[#eef2ff]/70 text-center text-xl font-bold text-slate-900 outline-none transition focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/20"
              />
            ))}
          </div>
        </fieldset>

        <div className="text-center text-xs text-slate-600">
          <span>Không nhận được mã? </span>
          {cooldown > 0 ? (
            <span className="font-semibold text-[#0284c7]">
              Gửi lại mã sau {formattedTimer}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !email}
              className="font-semibold text-[#0284c7] hover:underline disabled:opacity-50"
            >
              {resending ? "Đang gửi..." : "Gửi lại mã ngay"}
            </button>
          )}
        </div>

        <div className="rounded-xl border border-sky-200 bg-[#e0f2fe]/70 p-3.5 text-xs leading-relaxed text-[#0369a1]">
          <div className="flex items-start gap-2.5">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-[#0284c7]"
              aria-hidden="true"
            />
            <p>
              <strong className="font-semibold">Lưu ý bảo mật:</strong> Tuyệt
              đối không chia sẻ mã xác thực 6 chữ số này cho bất kỳ ai, kể cả
              đội ngũ hỗ trợ kỹ thuật Lumina.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {infoMessage && (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700"
          >
            {infoMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7cc4e4] px-4 py-3 text-sm font-semibold text-slate-900 shadow-xs transition hover:bg-[#5eb5dc] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{submitting ? "Đang xác nhận..." : "Xác nhận & Tiếp tục"}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Quay lại đăng nhập</span>
        </Link>
      </div>
    </div>
  );
}
