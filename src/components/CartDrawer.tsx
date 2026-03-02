'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Cart } from '@/components/Cart';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  useCartStore,
  selectCartCount,
  selectCartTotal,
} from '@/lib/stores/cart';
import { formatCurrency } from '@/lib/utils/format';

type Props = {
  children: (args: { count: number; openDrawer: () => void }) => ReactNode;
};

export function CartDrawer({ children }: Props) {
  const router = useRouter();
  const count = useCartStore(selectCartCount);
  const totalAmount = useCartStore(selectCartTotal);
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return (
    <>
      {children({ count, openDrawer: () => setOpen(true) })}
      {isDesktop ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="right"
            className="my-3 mr-3 flex h-[calc(100dvh-1.5rem)] w-[min(540px,calc(100vw-1.5rem))] max-w-none flex-col overflow-hidden rounded-2xl border p-4"
          >
            <SheetHeader>
              <SheetTitle>Giỏ hàng</SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              <Cart compact />
            </div>
            <SheetFooter className="mt-4 border-t pt-4 sm:flex-col sm:justify-start">
              <div className="w-full space-y-3">
                <p className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <strong>{formatCurrency(totalAmount)}</strong>
                </p>
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={count === 0}
                onClick={() => {
                  setOpen(false);
                  router.push('/cart');
                }}
              >
                Đặt hàng
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Giỏ hàng</DrawerTitle>
            </DrawerHeader>
            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              <Cart compact />
            </div>
            <DrawerFooter className="mt-4 border-t pt-4 sm:flex-col sm:justify-start">
              <p className="flex w-full items-center justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </p>
              <Button
                type="button"
                className="w-full"
                disabled={count === 0}
                onClick={() => {
                  setOpen(false);
                  router.push('/cart');
                }}
              >
                Đặt hàng
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
