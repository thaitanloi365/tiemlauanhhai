'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  formatCurrency,
  statusBadgeVariant,
  statusLabel,
} from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type DashboardResponse = {
  stats: {
    total: number;
    pending: number;
    preparing: number;
    delivered: number;
  };
  orders: Array<{
    id: string;
    customer_name: string;
    phone: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
};

export default function AdminDashboardPage() {
  const [visibleCount, setVisibleCount] = useState(6);
  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/admin/orders');
      const data = (await res.json()) as DashboardResponse;
      if (!res.ok)
        throw new Error(
          (data as { message?: string }).message ?? 'Không tải được dashboard',
        );
      return data;
    },
  });

  const orders = dashboardQuery.data?.orders ?? [];
  const stats = dashboardQuery.data?.stats ?? {
    total: 0,
    pending: 0,
    preparing: 0,
    delivered: 0,
  };
  const visibleOrders = useMemo(
    () => orders.slice(0, visibleCount),
    [orders, visibleCount],
  );

  return (
    <div className="container-shell space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/orders">Quản lý đơn</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/menu">Quản lý menu</Link>
          </Button>
        </div>
      </div>

      {dashboardQuery.isPending ? (
        <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      ) : dashboardQuery.isError ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-foreground">
          {dashboardQuery.error.message}
        </div>
      ) : (
        <>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Tổng đơn" value={stats.total} />
            <StatCard title="Chờ xác nhận" value={stats.pending} />
            <StatCard title="Đang chuẩn bị" value={stats.preparing} />
            <StatCard title="Đã giao" value={stats.delivered} />
          </div>

          <section className="rounded-md border border-border bg-card p-4">
            <h2 className="text-xl font-semibold">Đơn gần đây</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {visibleOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block rounded-xl border border-border bg-muted/40 p-3 text-sm transition hover:bg-muted"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      #{order.id.slice(0, 8)}
                    </p>
                    <Badge variant={statusBadgeVariant(order.status)}>
                      {statusLabel(order.status)}
                    </Badge>
                  </div>
                  <p className="mt-2 font-medium text-foreground">
                    {order.customer_name}
                  </p>
                  <p className="text-muted-foreground">{order.phone}</p>
                  <div className="mt-2 flex items-center justify-between text-muted-foreground">
                    <p className="font-medium">
                      {formatCurrency(order.total_amount ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            {visibleCount < orders.length ? (
              <div className="mt-3 text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                >
                  Tải thêm
                </Button>
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-0 text-xl leading-snug font-bold">{value}</p>
    </div>
  );
}
