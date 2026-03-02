'use client';

import { useState } from 'react';
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
  };

  return (
    <article className="space-y-5">
      <MediaGallery media={item.media} />
      <div className="card-surface p-4">
        <h1 className="text-2xl font-semibold">{item.name}</h1>
        <p className="mt-2 text-muted-foreground">{item.description}</p>
        {item.ingredients ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nguyên liệu: {item.ingredients}
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
              className="flex cursor-pointer items-center justify-between rounded-xl border p-3"
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
    </article>
  );
}
