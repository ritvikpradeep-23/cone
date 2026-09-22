"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LayoutGrid, Shuffle } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/gallery", label: "Gallery", icon: LayoutGrid },
  { href: "/mix", label: "Mix Canvas", icon: Shuffle },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/gallery") return pathname === "/gallery" || pathname.startsWith("/designs/");
  return pathname === href;
}

function Logomark({ size = 22 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[7px] font-mono text-[11px] font-bold text-white"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(155deg, var(--dg-accent), #5b5fd6)",
        boxShadow: "0 1px 1px rgb(0 0 0 / 0.2), inset 0 1px 0 rgb(255 255 255 / 0.15)",
      }}
    >
      D
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <nav className="flex items-center gap-1 overflow-x-auto border-b border-[var(--dg-border)] bg-[var(--dg-surface)]/60 px-3 py-2.5 backdrop-blur md:hidden">
        <Link href="/dashboard" className="mr-1 flex shrink-0 items-center gap-2 px-1">
          <Logomark size={20} />
        </Link>
        <div className="flex shrink-0 gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`dg-focus-ring flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-[var(--dg-accent-soft)] text-[var(--dg-accent-hover)]"
                    : "text-[var(--dg-muted)] hover:bg-white/5 hover:text-[var(--dg-text)]"
                }`}
              >
                <Icon size={14} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--dg-border)] px-3 py-5 md:flex">
        <Link href="/dashboard" className="mb-7 flex items-center gap-2.5 px-2">
          <Logomark />
          <span className="text-[15px] font-semibold tracking-tight text-[var(--dg-text)]">Design Gallery</span>
        </Link>
        <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--dg-muted-2)]">
          Browse
        </p>
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`dg-focus-ring group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--dg-accent-soft)] text-[var(--dg-accent-hover)]"
                    : "text-[var(--dg-muted)] hover:bg-white/5 hover:text-[var(--dg-text)]"
                }`}
              >
                {active ? (
                  <span
                    className="absolute -left-3 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full"
                    style={{ background: "var(--dg-accent)" }}
                  />
                ) : null}
                <Icon
                  size={16}
                  strokeWidth={2}
                  className={active ? "" : "text-[var(--dg-muted-2)] group-hover:text-[var(--dg-text)]"}
                />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-[var(--dg-border)] px-2.5 pt-4">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--dg-success)" }} />
          <p className="text-xs text-[var(--dg-muted-2)]">Generating daily</p>
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
