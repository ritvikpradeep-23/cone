import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, createSessionToken } from "@/lib/auth";
import { Logomark } from "@/components/logomark";

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        action={login}
        className="w-full max-w-sm rounded-xl border border-[var(--dg-border)] bg-[var(--dg-surface)] p-8"
        style={{ boxShadow: "var(--dg-shadow)" }}
      >
        <div className="mb-5">
          <Logomark size={44} />
        </div>
        <h1 className="mb-1 font-display text-2xl font-semibold tracking-tight text-[var(--dg-text)]">Design Gallery</h1>
        <p className="mb-6 text-sm text-[var(--dg-muted)]">Enter the shared password to continue.</p>
        <input
          type="password"
          name="password"
          autoFocus
          placeholder="Password"
          className="mb-3 w-full rounded-md border border-[var(--dg-border)] bg-[var(--dg-bg)] px-3 py-2 text-sm text-[var(--dg-text)] outline-none transition-colors focus:border-[var(--dg-accent)] focus:ring-2 focus:ring-[var(--dg-accent-soft)]"
        />
        {error ? <p className="mb-3 text-sm text-[var(--dg-danger)]">Incorrect password.</p> : null}
        <button
          type="submit"
          className="dg-focus-ring w-full rounded-md bg-[var(--dg-accent)] px-3 py-2 text-sm font-semibold text-[var(--dg-on-accent)] transition-colors hover:bg-[var(--dg-accent-hover)]"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
