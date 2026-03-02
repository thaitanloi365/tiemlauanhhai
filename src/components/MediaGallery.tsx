'use client';

import { useState } from 'react';
import type { MenuMedia } from '@/lib/types';
import { Button } from '@/components/ui/button';

type Props = {
  media: MenuMedia[];
};

export function MediaGallery({ media }: Props) {
  const [active, setActive] = useState(0);
  const current = media[active];

  if (!current) return null;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-black/5">
        {current.type === 'video' ? (
          <video
            className="aspect-video w-full"
            controls
            playsInline
            preload="metadata"
          >
            <source src={current.url} />
          </video>
        ) : (
          <img
            src={current.url}
            alt={current.alt_text || 'Hình ảnh món ăn'}
            className="aspect-video w-full object-cover"
          />
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {media.map((entry, index) => (
          <Button
            key={entry.id}
            type="button"
            variant="outline"
            className={`overflow-hidden rounded-xl p-0 ${index === active ? 'border-primary' : 'border-border'}`}
            onClick={() => setActive(index)}
          >
            {entry.type === 'video' ? (
              <div className="flex aspect-video w-24 items-center justify-center bg-muted text-xs">
                Video
              </div>
            ) : (
              <img
                src={entry.url}
                alt={entry.alt_text || 'thumb'}
                className="aspect-video w-24 object-cover"
              />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
