export const SESSION_COOKIE_NAME = "dg_session";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(appPassword: string): Promise<string> {
  return sha256Hex(`design-gallery-session:${appPassword}`);
}

export async function isValidSessionToken(
  token: string | undefined | null,
  appPassword: string
): Promise<boolean> {
  if (!token) return false;
  const expected = await createSessionToken(appPassword);
  return token === expected;
}
