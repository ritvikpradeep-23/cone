import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, createSessionToken } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";

  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    throw new Error("APP_PASSWORD is not configured on the server");
  }

  const submitted = formData.get("password");
  if (typeof submitted !== "string" || submitted !== appPassword) {
    redirect("/login?error=1");
  }

  const token = await createSessionToken(appPassword);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--dg-bg)]">
      <form
        action={login}
        className="w-full max-w-sm rounded-lg border border-[var(--dg-border)] bg-[var(--dg-surface)] p-8"
      >
        <h1 className="mb-1 text-lg font-medium text-[var(--dg-text)]">Design Gallery</h1>
        <p className="mb-6 text-sm text-[var(--dg-muted)]">Enter the shared password to continue.</p>
        <input
          type="password"
          name="password"
          autoFocus
          placeholder="Password"
          className="mb-3 w-full rounded-md border border-[var(--dg-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--dg-accent)]"
        />
        {error ? <p className="mb-3 text-sm text-red-600">Incorrect password.</p> : null}
        <button
          type="submit"
          className="w-full rounded-md bg-[var(--dg-accent)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
