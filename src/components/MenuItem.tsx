'use client';

import Link from 'next/link';
import type { MenuItem as MenuItemType } from '@/lib/types';
import { useCartStore } from '@/lib/stores/cart';
import { formatCurrency } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';

type Props = {
  item: MenuItemType;
};

export function MenuItem({ item }: Props) {
  const add = useCartStore((state) => state.add);
  const minPrice = Math.min(...item.variants.map((variant) => variant.price));
  const maxPrice = Math.max(...item.variants.map((variant) => variant.price));

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
  };

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
