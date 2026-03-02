'use client';

import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { formatCurrency, statusLabel } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type OrderDetailResponse = {
  order: {
    id: string;
    customer_name: string;
    phone: string;
    address: string;
    province: string;
    district: string;
    ward: string;
    note: string | null;
    scheduled_for: string | null;
    total_amount: number;
    status: string;
    tracking_id: string | null;
    tracking_url: string | null;
    expired_at: string | null;
  };
  items: Array<{
    id: string;
    unit_price: number;
    quantity: number;
    menu_variant?: { name?: string; menu_item?: { name?: string } };
  }>;
  logs: Array<{ status: string; created_at: string }>;
};

const STATUS_OPTIONS = [
  'pending',
  'confirmed',
  'preparing',
  'shipping',
  'delivered',
  'cancelled',
] as const;

function formatScheduledFor(value: string | null | undefined) {
  if (!value) return null;
  const start = new Date(value);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const dateLabel = start.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  const startLabel = start.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  const endLabel = end.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  return `${dateLabel} (${startLabel} - ${endLabel})`;
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['admin', 'order-detail', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${params.id}`);
      const data = (await res.json()) as OrderDetailResponse;
      if (!res.ok)
        throw new Error(
          (data as { message?: string }).message ?? 'Không tải được đơn hàng',
        );
      return data;
    },
  });

  const order = detailQuery.data?.order;
  const [status, setStatus] = useState(order?.status ?? 'pending');
  const [trackingId, setTrackingId] = useState(order?.tracking_id ?? '');
  const [trackingUrl, setTrackingUrl] = useState(order?.tracking_url ?? '');

  useEffect(() => {
    if (!order) return;
    setStatus(order.status);
    setTrackingId(order.tracking_id ?? '');
    setTrackingUrl(order.tracking_url ?? '');
  }, [order?.id, order?.status, order?.tracking_id, order?.tracking_url]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingId: trackingId || null,
          trackingUrl: trackingUrl || null,
        }),
      });
      const data = await res.json();
      setMessage(
        res.ok
          ? 'Đã cập nhật đơn hàng.'
          : (data.message ?? 'Không thể cập nhật'),
      );
      if (res.ok) {
        await queryClient.invalidateQueries({
          queryKey: ['admin', 'order-detail', params.id],
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container-shell space-y-4">
      <h1 className="text-3xl font-bold">Chi tiết đơn (Admin)</h1>
      {detailQuery.isPending ? (
        <p className="rounded-md border p-4 text-muted-foreground">
          Đang tải...
        </p>
      ) : detailQuery.isError ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-foreground">
          {detailQuery.error.message}
        </p>
      ) : order ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-border bg-card p-4">
            <h2 className="text-xl font-semibold">Thông tin đơn</h2>
            <p className="mt-2 text-sm">Khách: {order.customer_name}</p>
            {order.scheduled_for ? (
              <p className="mt-1 text-sm">
                Lịch nhận món:{' '}
                <strong>{formatScheduledFor(order.scheduled_for)}</strong>
              </p>
            ) : null}
            <div className="mt-2 space-y-2">
              {order.expired_at ? (
                <div className="rounded-xl border border-border bg-muted p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Đơn đang quá hạn
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    Đơn đã quá 24 giờ nhưng bạn vẫn có thể chuyển sang{' '}
                    <strong>Đã xác nhận</strong> nếu nhà hàng và khách tiếp tục
                    xử lý đơn.
                  </p>
                </div>
              ) : null}
              <div className="rounded-xl border border-border bg-muted p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Số điện thoại
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {order.phone}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Địa chỉ giao hàng
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {order.address}, {order.ward}, {order.district},{' '}
                  {order.province}
                </p>
              </div>
            </div>
            {order.note ? (
              <div className="mt-3 rounded-xl border border-border bg-muted p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Ghi chú khách hàng
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {order.note}
                </p>
              </div>
            ) : null}
            <div className="mt-4 space-y-2">
              <div className="grid gap-1 text-sm">
                <Label>Trạng thái</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {statusLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1 text-sm">
                <Label>Tracking ID</Label>
                <Input
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                />
              </div>
              <div className="grid gap-1 text-sm">
                <Label>Tracking URL</Label>
                <Input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={save}
              disabled={saving}
              className="mt-4"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
            {message ? (
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            ) : null}
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <h2 className="text-xl font-semibold">Món đã đặt</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {detailQuery.data?.items.map((item) => (
                <li key={item.id} className="rounded-lg bg-muted p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {item.menu_variant?.menu_item?.name} -{' '}
                        {item.menu_variant?.name}
                      </p>
                      <p className="text-muted-foreground">
                        {formatCurrency(item.unit_price ?? 0)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(
                        (item.unit_price ?? 0) * (item.quantity ?? 0),
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="font-medium">Tổng đơn</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(order.total_amount ?? 0)}
              </span>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Timeline trạng thái</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {detailQuery.data?.logs.map((log, index) => (
                <li
                  key={`${log.created_at}-${index}`}
                  className="rounded-lg bg-muted p-2"
                >
                  {statusLabel(log.status)} -{' '}
                  {new Date(log.created_at).toLocaleString('vi-VN')}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-foreground">
          Không tìm thấy đơn.
        </p>
      )}
    </div>
  );
}
