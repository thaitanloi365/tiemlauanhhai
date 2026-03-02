'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const totalSpreads = Math.ceil(pages.length / 2);
  const left = pages[spread * 2];
  const right = pages[spread * 2 + 1];

  const goPrev = () => {
    if (spread === 0) return;
    setDirection('prev');
    setSpread((v) => Math.max(0, v - 1));
  };

  const goNext = () => {
    if (spread === totalSpreads - 1) return;
    setDirection('next');
    setSpread((v) => Math.min(totalSpreads - 1, v + 1));
  };

  return (
    <div className="space-y-2">
      <div className="relative md:px-10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Trang trước"
          className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 text-primary hover:bg-primary/10 hover:text-primary md:inline-flex"
          disabled={spread === 0}
          onClick={goPrev}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Trang sau"
          className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 text-primary hover:bg-primary/10 hover:text-primary md:inline-flex"
          disabled={spread === totalSpreads - 1}
          onClick={goNext}
        >
          <ChevronRight className="size-4" />
        </Button>
        <div className="card-surface overflow-clip p-2 sm:p-3">
          <div
            key={`spread-${spread}-${direction ?? 'idle'}`}
            className={`grid min-h-[220px] grid-cols-2 rounded-xl bg-muted/40 transform-3d sm:min-h-[380px] ${
              direction === 'next'
                ? 'animate-book-next'
                : direction === 'prev'
                  ? 'animate-book-prev'
                  : ''
            }`}
          >
            <div className="overflow-hidden rounded-l-xl border-r border-border">
              {left ? (
                <img
                  src={left.image}
                  alt={`Trang ${left.number}`}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="overflow-hidden rounded-r-xl">
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
        <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 md:block">
          <span className="inline-flex rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-border/60 backdrop-blur">
            Trang {spread * 2 + 1}-{Math.min(pages.length, spread * 2 + 2)}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-primary hover:bg-primary/10 hover:text-primary"
          aria-label="Trang trước"
          disabled={spread === 0}
          onClick={goPrev}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Trang {spread * 2 + 1}-{Math.min(pages.length, spread * 2 + 2)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-primary hover:bg-primary/10 hover:text-primary"
          aria-label="Trang sau"
          disabled={spread === totalSpreads - 1}
          onClick={goNext}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
