import { z } from "zod";

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Họ và tên phải có ít nhất 2 ký tự")
      .max(100, "Họ và tên tối đa 100 ký tự"),
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập email")
      .pipe(z.email("Email không hợp lệ")),
    password: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .max(128, "Mật khẩu tối đa 128 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
    acceptTerms: z.literal(true, {
      error: "Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const otpSchema = z.object({
  email: z.string().trim().pipe(z.email("Email không hợp lệ")),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Mã OTP gồm đúng 6 chữ số"),
});

export type OtpFormValues = z.infer<typeof otpSchema>;

export const forgotPasswordEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .pipe(z.email("Email không hợp lệ")),
});

export type ForgotPasswordEmailValues = z.infer<
  typeof forgotPasswordEmailSchema
>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
      .max(128, "Mật khẩu tối đa 128 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
