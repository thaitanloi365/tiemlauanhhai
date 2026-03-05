'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { PublicPageTransition } from '@/components/PublicPageTransition';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <PublicPageTransition>{children}</PublicPageTransition>
        </NuqsAdapter>
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                'rounded-xl border-primary/30 bg-primary/10 text-foreground shadow-lg backdrop-blur px-4 py-3 min-w-[320px] sm:min-w-[420px]',
              title: 'text-foreground font-semibold text-[15px]',
              description: 'text-muted-foreground text-[14px]',
              actionButton:
                '!border-0 !bg-primary !text-primary-foreground hover:!bg-primary/90',
              cancelButton:
                'bg-secondary text-secondary-foreground hover:bg-secondary/90 border-0',
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
