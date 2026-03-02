'use client';

import { useState } from 'react';
import { Facebook, MessageCircleMore, Phone, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function FloatingContact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 md:bottom-6">
      {open ? (
        <>
          <Button
            asChild
            size="icon"
            variant="outline"
            className="size-12 rounded-full"
          >
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
            >
              <Facebook />
            </a>
          </Button>
          <Button
            asChild
            size="icon"
            variant="outline"
            className="size-12 rounded-full"
          >
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noreferrer"
              aria-label="Zalo"
            >
              <MessageCircleMore />
            </a>
          </Button>
          <Button
            asChild
            size="icon"
            variant="outline"
            className="size-12 rounded-full"
          >
            <a href="tel:0900000000" aria-label="Gọi hotline">
              <Phone />
            </a>
          </Button>
        </>
      ) : null}
      <Button
        type="button"
        size="icon"
        className="size-14 rounded-full shadow-xl"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X /> : <Plus />}
      </Button>
    </div>
  );
}
