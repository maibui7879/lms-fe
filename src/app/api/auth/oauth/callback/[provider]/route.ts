import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  assertSessionDeployment,
  gatewayFetch,
  setSessionCookies,
  tokenSessionSchema,
} from "@/lib/auth-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (provider !== "google" && provider !== "github") {
    return NextResponse.redirect(
      new URL("/login?error=invalid_provider", request.url),
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_missing_code", request.url),
    );
  }

  try {
    assertSessionDeployment();
    const upstreamUrl = new URL(
      `/api/v1/auth/${provider}/callback`,
      "http://placeholder",
    );
    upstreamUrl.searchParams.set("code", code);
    if (state) upstreamUrl.searchParams.set("state", state);

    const upstream = await gatewayFetch(
      `${upstreamUrl.pathname}${upstreamUrl.search}`,
      {
        method: "GET",
      },
    );

    if (!upstream.ok) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_failed", request.url),
      );
    }

    const parsed = z
      .object({ data: tokenSessionSchema })
      .safeParse(await upstream.json());

    if (
      !parsed.success ||
      parsed.data.data.user.status === "INACTIVE" ||
      Date.parse(parsed.data.data.refreshExpiresAt) <= Date.now()
    ) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_session", request.url),
      );
    }

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    setSessionCookies(response, parsed.data.data);
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=oauth_unavailable", request.url),
    );
  }
}
