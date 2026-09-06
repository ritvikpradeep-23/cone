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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <nav className="flex items-center gap-1 border-b border-[var(--dg-border)] px-4 py-2 md:hidden">
        <span className="mr-2 text-sm font-medium text-[var(--dg-text)]">Design Gallery</span>
        <div className="ml-auto flex gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  active ? "bg-[var(--dg-accent)] text-white" : "text-[var(--dg-muted)] hover:bg-white/5"
                }`}
              >
                <Icon size={14} strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--dg-border)] px-3 py-4 md:flex">
        <Link href="/dashboard" className="mb-6 px-2 text-sm font-medium text-[var(--dg-text)]">
          Design Gallery
        </Link>
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--dg-accent)] text-white"
                    : "text-[var(--dg-muted)] hover:bg-white/5 hover:text-[var(--dg-text)]"
                }`}
              >
                <Icon size={16} strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
