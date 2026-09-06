import type { NextRequest } from "next/server";

export const ANON_ID_COOKIE_NAME = "dg_anon_id";

export function getAnonId(request: NextRequest): string | null {
  return request.cookies.get(ANON_ID_COOKIE_NAME)?.value ?? null;
}
