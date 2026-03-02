'use client';

import { Button } from '@/components/ui/button';
import { CartDrawer } from '@/components/CartDrawer';

export function CartButton() {
  return (
    <CartDrawer>
      {({ count, openDrawer }) => (
        <Button
          type="button"
          variant="outline"
          className="relative"
          onClick={openDrawer}
        >
          Giỏ hàng
          {count > 0 ? (
            <span className="notification-badge-md absolute -right-2 -top-2">
              {count}
            </span>
          ) : null}
        </Button>
      )}
    </CartDrawer>
  );
}
