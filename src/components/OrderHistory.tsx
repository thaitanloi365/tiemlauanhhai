'use client';

import Link from 'next/link';
import type { Order } from '@/lib/types';
import { formatCurrency, statusClass, statusLabel } from '@/lib/utils/format';

type Props = {
  orders: Order[];
};

export function OrderHistory({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
        Bạn chưa có đơn hàng nào.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/orders/${order.id}`}
          className="card-surface block p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">
                Mã đơn: {order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="mt-1 font-semibold">
                {formatCurrency(order.total_amount)}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass(order.status)}`}
            >
              {statusLabel(order.status)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
