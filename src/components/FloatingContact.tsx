'use client';

import { useState } from 'react';
import { Facebook, MessageCircleMore, Phone, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function FloatingContact() {
  const [open, setOpen] = useState(false);
  const contactActions = [
    {
      href: 'https://facebook.com',
      label: 'Facebook',
      icon: <Facebook className="text-primary" />,
      external: true,
    },
    {
      href: 'https://zalo.me',
      label: 'Zalo',
      icon: <MessageCircleMore className="text-primary" />,
      external: true,
    },
    {
      href: 'tel:0900000000',
      label: 'Gọi hotline',
      icon: <Phone className="text-primary" />,
      external: false,
    },
  ];

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 md:bottom-6">
      <div
        className={`flex flex-col items-end gap-2 transition-all duration-300 ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {contactActions.map((action, index) => (
          <Button
            key={action.label}
            asChild
            size="icon"
            variant="outline"
            className={`size-12 rounded-full transition-all duration-300 ${
              open
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-3 scale-95 opacity-0'
            }`}
            style={{
              transitionDelay: open
                ? `${index * 50}ms`
                : `${(contactActions.length - index - 1) * 50}ms`,
            }}
          >
            <a
              href={action.href}
              target={action.external ? '_blank' : undefined}
              rel={action.external ? 'noreferrer' : undefined}
              aria-label={action.label}
            >
              {action.icon}
            </a>
          </Button>
        ))}
      </div>
      <Button
        type="button"
        size="icon"
        className={`size-14 rounded-full shadow-xl transition-transform duration-300 ${
          open ? 'scale-105' : 'scale-100'
        }`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="relative flex size-5 items-center justify-center">
          <Plus
            className={`absolute m-auto size-5 transition-all duration-200 ${
              open
                ? 'rotate-90 scale-0 opacity-0'
                : 'rotate-0 scale-100 opacity-100'
            }`}
          />
          <X
            className={`absolute m-auto size-5 transition-all duration-200 ${
              open
                ? 'rotate-0 scale-100 opacity-100'
                : '-rotate-90 scale-0 opacity-0'
            }`}
          />
        </span>
      </Button>
    </div>
  );
}
