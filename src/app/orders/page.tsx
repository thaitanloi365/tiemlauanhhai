'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { OrderHistory } from '@/components/OrderHistory';
import { sessionStore } from '@/lib/stores/session';

type OrdersResponse = {
  orders: AppTypes.Order[];
};

export default function OrdersPage() {
  const sessionId = useMemo(() => sessionStore.getCurrent(), []);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['orders', sessionId],
    queryFn: async (): Promise<OrdersResponse> => {
      const res = await fetch(
        `/api/orders?sessionId=${encodeURIComponent(sessionId)}`,
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || 'Không thể tải danh sách đơn hàng.');
      return json;
    },
  });

  return (
    <>
      <Header />
      <main className="container-shell py-8">
        <h1 className="text-3xl font-semibold">Lịch sử đơn hàng</h1>
        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Đang tải đơn hàng...
          </p>
        ) : null}
        {isError ? (
          <p className="mt-4 text-sm text-destructive">
            {(error as Error).message}
          </p>
        ) : null}
        <div className="mt-4">
          <OrderHistory orders={data?.orders ?? []} />
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
