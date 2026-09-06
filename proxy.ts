import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, isValidSessionToken } from "@/lib/auth";
import { ANON_ID_COOKIE_NAME } from "@/lib/anon-id";

const PUBLIC_PATHS = ["/login", "/api/cron"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response: NextResponse;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    response = NextResponse.next();
  } else {
    const appPassword = process.env.APP_PASSWORD;
    if (!appPassword) {
      // No password configured: leave the app open (local/dev convenience).
      // Set APP_PASSWORD before deploying anywhere reachable by others.
      response = NextResponse.next();
    } else {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      const valid = await isValidSessionToken(token, appPassword);
      if (!valid) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
      response = NextResponse.next();
    }
  }

  // Long-lived per-browser id for "My Store" saves — no accounts, no PII.
  if (!request.cookies.get(ANON_ID_COOKIE_NAME)) {
    response.cookies.set(ANON_ID_COOKIE_NAME, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 2,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
