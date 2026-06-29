"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import type { AdminUser } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/users", label: "Users" },
] as const;

/**
 * Shared chrome for every authenticated admin page: a fixed sidebar with the
 * primary nav + sign out, and a scrollable content column. Pages render their
 * own header/content inside `children`.
 */
export function AdminShell({
  user,
  children,
}: {
  user: AdminUser | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function onSignOut() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="flex flex-col border-r border-border bg-surface px-4 py-6">
        <div className="px-2 mb-8">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            EduStream
          </div>
          <div className="font-display text-lg font-bold text-text-primary">
            Admin
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-brand-subtle text-brand"
                    : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4 mt-4">
          {user && (
            <div className="px-3 mb-3">
              <div className="truncate text-sm font-semibold text-text-primary">
                {user.name}
              </div>
              <div className="truncate text-xs text-text-tertiary">
                {user.email}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onSignOut}
            className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-alt hover:text-error"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
