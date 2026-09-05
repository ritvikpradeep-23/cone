import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, isValidSessionToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/cron"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    // No password configured: leave the app open (local/dev convenience).
    // Set APP_PASSWORD before deploying anywhere reachable by others.
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = await isValidSessionToken(token, appPassword);
  if (!valid) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
