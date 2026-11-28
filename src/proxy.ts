import { NextResponse, type NextRequest } from "next/server";
import { paths } from "@/route/paths";

export function proxy(request: NextRequest) {
  if (!request.cookies.has("lms_access")) {
    const url = new URL(
      request.cookies.has("lms_refresh") ? paths.restoreSession : paths.login,
      request.url,
    );
    url.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/dashboard/:path*"] };
