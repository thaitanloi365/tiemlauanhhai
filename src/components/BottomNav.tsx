'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CartDrawer } from '@/components/CartDrawer';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 md:hidden">
      <div className="mx-auto flex h-16 max-w-xl items-center justify-around">
        <Link
          href="/"
          className={`text-sm font-medium ${pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          Trang chủ
        </Link>
        <Link
          href="/menu"
          className={`text-sm font-medium ${pathname.startsWith('/menu') ? 'text-primary' : 'text-muted-foreground'}`}
        >
          Menu
        </Link>
        <CartDrawer>
          {({ count, openDrawer }) => (
            <button
              type="button"
              className={`relative text-sm font-medium ${pathname === '/cart' ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={openDrawer}
            >
              Giỏ hàng
              {count > 0 ? (
                <span className="notification-badge-sm absolute -right-5 -top-3">
                  {count}
                </span>
              ) : null}
            </button>
          )}
        </CartDrawer>
        <Link
          href="/orders"
          className={`text-sm font-medium ${pathname.startsWith('/orders') ? 'text-primary' : 'text-muted-foreground'}`}
        >
          Đơn hàng
        </Link>
      </div>
    </nav>
  );
}
