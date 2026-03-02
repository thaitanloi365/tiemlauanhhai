'use client';

import Link from 'next/link';
import { useCartStore, selectCartTotal } from '@/lib/stores/cart';
import { formatCurrency } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';

export function Cart() {
  const lines = useCartStore((state) => state.lines);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);
  const total = useCartStore(selectCartTotal);

  if (lines.length === 0) {
    return (
      <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
        Giỏ hàng đang trống.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {lines.map((line) => (
        <div
          key={line.variantId}
          className="rounded-xl border border-border p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{line.itemName}</p>
              <p className="text-xs text-muted-foreground">
                {line.variantName}
              </p>
              <p className="text-sm text-primary">
                {formatCurrency(line.price)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => remove(line.variantId)}
              >
                Xóa
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={line.quantity <= 1}
                  onClick={() =>
                    updateQuantity(line.variantId, line.quantity - 1)
                  }
                >
                  -
                </Button>
                <span className="w-7 text-center">{line.quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() =>
                    updateQuantity(line.variantId, line.quantity + 1)
                  }
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="rounded-xl border border-border p-3">
        <p className="flex items-center justify-between">
          <span>Tạm tính</span>
          <strong>{formatCurrency(total)}</strong>
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={clear}
          >
            Xóa tất cả
          </Button>
          <Button asChild className="flex-1">
            <Link href="/menu" className="text-center">
              Xem thêm món
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
