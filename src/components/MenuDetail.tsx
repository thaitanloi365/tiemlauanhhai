'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { MenuItem } from '@/lib/types';
import { useCartStore } from '@/lib/stores/cart';
import { formatCurrency } from '@/lib/utils/format';
import { MediaGallery } from '@/components/MediaGallery';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type Props = {
  item: MenuItem;
};

export function MenuDetail({ item }: Props) {
  const add = useCartStore((state) => state.add);
  const [selectedVariantId, setSelectedVariantId] = useState(
    item.variants.find((entry) => entry.is_default)?.id ??
      item.variants[0]?.id ??
      '',
  );
  const selectedVariant = item.variants.find(
    (entry) => entry.id === selectedVariantId,
  );
  const servingText =
    selectedVariant?.serves_min && selectedVariant?.serves_max
      ? `${selectedVariant.serves_min}-${selectedVariant.serves_max} người ăn`
      : selectedVariant?.serves_min
        ? `Từ ${selectedVariant.serves_min} người ăn`
        : null;

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

  const addToCart = () => {
    if (!selectedVariant) return;
    add({
      variantId: selectedVariant.id,
      itemId: item.id,
      itemName: item.name,
      itemSlug: item.slug,
      variantName: selectedVariant.name,
      itemNote: item.note,
      price: selectedVariant.price,
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

  return (
    <article className="grid gap-5 lg:grid-cols-2 lg:gap-6">
      <div>
        <MediaGallery media={item.media} />
      </div>
      <div className="space-y-4">
        <div className="card-surface p-4 sm:p-5">
          <h1 className="text-2xl font-semibold sm:text-3xl">{item.name}</h1>
          <p className="mt-2 text-muted-foreground">{item.description}</p>
          {item.ingredients ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Nguyên liệu: {item.ingredients}
            </p>
          ) : null}
          {(item.preparation_time_minutes || item.note) ? (
            <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/30 p-3">
              <h2 className="inline-flex rounded-md bg-primary/10 px-2 py-1 text-sm font-semibold uppercase tracking-wide text-primary">
                Thông tin quan trọng
              </h2>
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
        </div>
        <div className="card-surface p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Chọn khẩu phần</h2>
              <p className="text-sm text-muted-foreground">
                Chọn size phù hợp số người ăn
              </p>
            </div>
            {selectedVariant ? (
              <strong className="text-base text-primary sm:text-lg">
                {formatCurrency(selectedVariant.price)}
              </strong>
            ) : null}
          </div>
          {servingText ? (
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Khẩu phần đang chọn: {servingText}
            </p>
          ) : null}
          <RadioGroup
            value={selectedVariantId}
            onValueChange={setSelectedVariantId}
            className="mt-4 space-y-2"
          >
            {item.variants.map((variant) => (
              <Label
                key={variant.id}
                className="flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors hover:border-primary/60"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={variant.id} />
                  <span>{variant.name}</span>
                </div>
                <strong className="text-primary">
                  {formatCurrency(variant.price)}
                </strong>
              </Label>
            ))}
          </RadioGroup>
          <Button
            type="button"
            className="mt-4 w-full"
            onClick={addToCart}
            disabled={!selectedVariant}
          >
            Thêm vào giỏ
          </Button>
        </div>
      </div>
    </article>
  );
}
