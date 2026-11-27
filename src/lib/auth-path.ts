export function safeReturnPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/dashboard") ||
    value.startsWith("//") ||
    /[\\\r\n]/.test(value)
  )
    return "/dashboard";
  const parsed = new URL(value, "http://local.test");
  return parsed.origin === "http://local.test" &&
    (parsed.pathname === "/dashboard" ||
      parsed.pathname.startsWith("/dashboard/"))
    ? parsed.pathname + parsed.search
    : "/dashboard";
}
