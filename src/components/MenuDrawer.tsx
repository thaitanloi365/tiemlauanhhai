'use client';

import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/lib/stores/cart';
import { formatCurrency } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type Props = {
  open: boolean;
  onClose: () => void;
};

type MenuResponse = {
  categories: AppTypes.Category[];
  menuItems: AppTypes.MenuItem[];
};

export function MenuDrawer({ open, onClose }: Props) {
  const add = useCartStore((state) => state.add);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['menu-drawer'],
    queryFn: async (): Promise<MenuResponse> => {
      const res = await fetch('/api/menu');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Không thể tải thực đơn');
      return json;
    },
    enabled: open,
  });

  const categoryNameById = new Map(
    (data?.categories ?? []).map((entry) => [entry.id, entry.name]),
  );

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="inset-x-0 bottom-0 top-auto max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-t p-4 sm:max-w-none md:inset-y-0 md:left-auto md:right-0 md:top-0 md:max-h-none md:w-[760px] md:rounded-none md:border-l md:border-t-0"
      >
        <SheetHeader>
          <SheetTitle>Thực đơn</SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải thực đơn...</p>
        ) : null}
        {isError ? (
          <p className="text-sm text-destructive">Không thể tải thực đơn.</p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          {(data?.menuItems ?? []).map((item) => {
            const variant =
              item.variants.find((entry) => entry.is_default) ??
              item.variants[0];
            if (!variant) return null;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-border p-3"
              >
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {categoryNameById.get(item.category_id) ?? 'Món ăn'}
                </p>
                <p className="mt-1 text-sm font-semibold text-primary">
                  {formatCurrency(variant.price)}
                </p>
                <Button
                  type="button"
                  className="mt-2 w-full"
                  onClick={() =>
                    add({
                      variantId: variant.id,
                      itemId: item.id,
                      itemName: item.name,
                      itemSlug: item.slug,
                      variantName: variant.name,
                      itemNote: item.note,
                      price: variant.price,
                      thumbnailUrl: item.thumbnail_url,
                    })
                  }
                >
                  Thêm vào giỏ
                </Button>
              </div>
            );
          })}
        </div>
        <SheetFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
