'use client';

import Link from 'next/link';
import { CartButton } from '@/components/CartButton';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95">
      <div className="container-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Tiệm Lẩu Anh Hai"
            className="size-9 rounded-md object-contain"
          />
          <div>
            <p className="text-sm text-muted-foreground">Tiệm Lẩu</p>
            <p className="text-lg font-bold leading-none">Anh Hai</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/menu" className="hover:text-primary">
            Thực đơn
          </Link>
          <Link href="/orders" className="hover:text-primary">
            Đơn hàng
          </Link>
        </nav>
        <CartButton />
      </div>
    </header>
  );
}
