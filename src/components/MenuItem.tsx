'use client';

import Link from 'next/link';
import type { MenuItem as MenuItemType } from '@/lib/types';
import { toast } from 'sonner';
import { useCartStore } from '@/lib/stores/cart';
import { formatCurrency } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Props = {
  item: MenuItemType;
  detailMode?: 'page' | 'dialog';
};

export function MenuItem({ item, detailMode = 'page' }: Props) {
  const add = useCartStore((state) => state.add);
  const minPrice = Math.min(...item.variants.map((variant) => variant.price));
  const maxPrice = Math.max(...item.variants.map((variant) => variant.price));

  const openVisibleCartDrawer = () => {
    if (typeof window === 'undefined') return;
    const triggers = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-cart-drawer-trigger]'),
    );
    const visibleTrigger = triggers.find((trigger) => {
      const styles = window.getComputedStyle(trigger);
      const rect = trigger.getBoundingClientRect();
      return (
        styles.display !== 'none' &&
        styles.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0
      );
    });
    visibleTrigger?.click();
  };

  const onQuickAdd = () => {
    const variant =
      item.variants.find((entry) => entry.is_default) ?? item.variants[0];
    if (!variant) return;
    add({
      variantId: variant.id,
      itemId: item.id,
      itemName: item.name,
      itemSlug: item.slug,
      variantName: variant.name,
      itemNote: item.note,
      price: variant.price,
      thumbnailUrl: item.thumbnail_url,
    });
    toast.success(`Đã thêm ${item.name} vào giỏ hàng`, {
      duration: 5000,
      action: {
        label: 'Xem giỏ hàng',
        onClick: openVisibleCartDrawer,
      },
    });
  };

  const detailDialogContent = (
    <DialogContent className="max-h-[85dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{item.name}</DialogTitle>
        <DialogDescription>
          {item.description ?? 'Món ngon chuẩn vị miền Tây'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <img
          src={item.thumbnail_url || '/logo.png'}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="aspect-video w-full rounded-lg object-cover"
        />
        {item.ingredients ? (
          <p className="text-sm text-muted-foreground">
            Nguyên liệu: {item.ingredients}
          </p>
        ) : null}
        {(item.preparation_time_minutes || item.note) ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <h3 className="inline-flex rounded-md bg-primary/10 px-2 py-1 text-sm font-semibold uppercase tracking-wide text-primary">
              Thông tin quan trọng
            </h3>
            {item.preparation_time_minutes ? (
              <p className="text-sm">
                Thời gian chuẩn bị dự kiến:{' '}
                <strong>{item.preparation_time_minutes} phút</strong>
              </p>
            ) : null}
            {item.note ? (
              <p className="text-sm text-muted-foreground">
                Lưu ý từ nhà hàng: {item.note}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-sm font-semibold">Khẩu phần</p>
          <div className="space-y-1">
            {item.variants.map((variant) => (
              <p
                key={variant.id}
                className="flex items-center justify-between text-sm"
              >
                <span>{variant.name}</span>
                <strong>{formatCurrency(variant.price)}</strong>
              </p>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" className="w-full" onClick={onQuickAdd}>
          Thêm vào giỏ
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  if (detailMode === 'dialog') {
    return (
      <Dialog>
        <div className="card-surface relative flex h-full flex-col overflow-hidden">
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`Xem chi tiet ${item.name}`}
              className="absolute inset-0 z-10"
            />
          </DialogTrigger>
          <div className="aspect-video w-full overflow-hidden">
            <img
              src={item.thumbnail_url || '/logo.png'}
              alt={item.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col px-3 py-2">
            <h3 className="text-base font-semibold">{item.name}</h3>
            <p className="text-sm text-muted-foreground">
              {item.description ?? 'Món ngon chuẩn vị miền Tây'}
            </p>
            <div className="mt-auto pt-4">
              <p className="font-semibold text-primary">
                {minPrice === maxPrice
                  ? formatCurrency(minPrice)
                  : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
              </p>
              <div className="relative z-20 mt-2 flex gap-2">
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="flex-1">
                    Chi tiết
                  </Button>
                </DialogTrigger>
                <Button type="button" className="flex-1" onClick={onQuickAdd}>
                  Thêm vào giỏ
                </Button>
              </div>
            </div>
          </div>
        </div>
        {detailDialogContent}
      </Dialog>
    );
  }

  return (
    <div className="card-surface relative flex h-full flex-col overflow-hidden">
      <Link
        href={`/menu/${item.slug}`}
        aria-label={`Xem chi tiet ${item.name}`}
        className="absolute inset-0 z-10"
      />
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={item.thumbnail_url || '/logo.png'}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col px-3 py-2">
        <h3 className="text-base font-semibold">{item.name}</h3>
        <p className="text-sm text-muted-foreground">
          {item.description ?? 'Món ngon chuẩn vị miền Tây'}
        </p>
        <div className="mt-auto pt-4">
          <p className="font-semibold text-primary">
            {minPrice === maxPrice
              ? formatCurrency(minPrice)
              : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
          </p>
          <div className="relative z-20 mt-2 flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/menu/${item.slug}`} className="text-center">
                Chi tiết
              </Link>
            </Button>
            <Button type="button" className="flex-1" onClick={onQuickAdd}>
              Thêm vào giỏ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
