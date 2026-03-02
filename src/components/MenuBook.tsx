'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

export function MenuBook() {
  const pages = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => ({
        number: index + 1,
        image: '/logo.png',
      })),
    [],
  );
  const [spread, setSpread] = useState(0);
  const totalSpreads = Math.ceil(pages.length / 2);
  const left = pages[spread * 2];
  const right = pages[spread * 2 + 1];

  return (
    <div className="space-y-2">
      <div className="card-surface overflow-hidden p-2 sm:p-3">
        <div className="grid min-h-[220px] grid-cols-2 overflow-hidden rounded-xl bg-muted/40 sm:min-h-[380px]">
          <div className="border-r border-border">
            {left ? (
              <img
                src={left.image}
                alt={`Trang ${left.number}`}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div>
            {right ? (
              <img
                src={right.image}
                alt={`Trang ${right.number}`}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={spread === 0}
          onClick={() => setSpread((v) => Math.max(0, v - 1))}
        >
          Trang trước
        </Button>
        <span className="text-sm text-muted-foreground">
          Trang {spread * 2 + 1}-{Math.min(pages.length, spread * 2 + 2)}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={spread === totalSpreads - 1}
          onClick={() => setSpread((v) => Math.min(totalSpreads - 1, v + 1))}
        >
          Trang sau
        </Button>
      </div>
    </div>
  );
}
