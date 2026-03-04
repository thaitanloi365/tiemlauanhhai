'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type AdminRole = 'super_admin' | 'manager';

type AdminSidebarProps = {
  adminEmail?: string;
  adminRole?: AdminRole;
  children: React.ReactNode;
};

export function AdminSidebar({
  adminEmail = 'Admin',
  adminRole = 'manager',
  children,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = useMemo(() => {
    const items = [
      { href: '/admin', label: 'Dashboard' },
      { href: '/admin/statistics', label: 'Thống kê' },
      { href: '/admin/menu', label: 'Menu' },
      { href: '/admin/orders', label: 'Đơn hàng' },
      { href: '/admin/promotions', label: 'Khuyến mãi' },
    ];
    if (adminRole === 'super_admin') {
      items.push({ href: '/admin/employees', label: 'Nhân viên' });
    }
    items.push({ href: '/admin/settings', label: 'Cài đặt' });
    return items;
  }, [adminRole]);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
      setLoggingOut(false);
    }
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-section">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo Tiệm Lẩu Anh Hai"
              className="size-9 rounded-md object-contain"
            />
            <div>
              <p className="text-xs uppercase tracking-wide text-sidebar-foreground/70">
                Tiệm Lẩu Anh Hai
              </p>
              <p className="mt-1 text-xl font-semibold">Admin Panel</p>
            </div>
          </div>
          <p className="mt-2 truncate text-sm text-sidebar-foreground/80">
            {adminEmail}
          </p>
        </div>
        <div className="admin-sidebar-divider" />
        <nav className="admin-sidebar-nav flex-1">
          {navItems.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`admin-sidebar-link ${active ? 'admin-sidebar-link-active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <Button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="w-full"
          >
            {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </Button>
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[280px] border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:max-w-none"
        >
          <SheetHeader className="admin-sidebar-section pb-0">
            <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo Tiệm Lẩu Anh Hai"
                className="size-9 rounded-md object-contain"
              />
              <div>
                <p className="text-xs uppercase tracking-wide text-sidebar-foreground/70">
                  Tiệm Lẩu Anh Hai
                </p>
                <p className="mt-1 text-xl font-semibold">Admin Panel</p>
              </div>
            </div>
            <p className="mt-2 truncate text-sm text-sidebar-foreground/80">
              {adminEmail}
            </p>
          </SheetHeader>
          <div className="admin-sidebar-divider" />
          <nav className="admin-sidebar-nav">
            {navItems.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={() => setMobileOpen(false)}
                  className={`admin-sidebar-link ${active ? 'admin-sidebar-link-active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setMobileOpen(true)}
                className="size-9 lg:hidden"
              >
                <svg
                  viewBox="0 0 20 20"
                  className="size-5 fill-current"
                  aria-hidden="true"
                >
                  <path d="M3 5h14v2H3V5Zm0 4h14v2H3V9Zm0 4h14v2H3v-2Z" />
                </svg>
              </Button>
              <div>
                <p className="text-sm text-muted-foreground">
                  Khu vực quản trị
                </p>
                <p className="font-semibold">Admin Dashboard</p>
              </div>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">
              {adminEmail}
            </p>
          </div>
        </header>
        <main className="min-h-[calc(100dvh-4rem)] px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
