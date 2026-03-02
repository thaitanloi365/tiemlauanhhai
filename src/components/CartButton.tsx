'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore, selectCartCount } from '@/lib/stores/cart';
import { Button } from '@/components/ui/button';

export function CartButton() {
  const pathname = usePathname();
  const count = useCartStore(selectCartCount);

  if (pathname === '/cart') {
    return (
      <Button
        type="button"
        variant="outline"
        className="relative"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        Giỏ hàng
        {count > 0 ? (
          <span className="notification-badge-md absolute -right-2 -top-2">
            {count}
          </span>
        ) : null}
      </Button>
    );
  }

  return (
    <Button asChild variant="outline" className="relative">
      <Link href="/cart">
        Giỏ hàng
        {count > 0 ? (
          <span className="notification-badge-md absolute -right-2 -top-2">
            {count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
