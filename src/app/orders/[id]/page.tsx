'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { ReviewForm } from '@/components/ReviewForm';
import { formatDateTimeVi } from '@/lib/date';
import { sessionStore } from '@/lib/stores/session';
import { formatCurrency, statusClass, statusLabel } from '@/lib/utils/format';

type OrderDetailResponse = {
  order: AppTypes.Order;
  items: AppTypes.OrderItem[];
  logs: Array<{ id: string; status: string; created_at: string }>;
  review: AppTypes.Review | null;
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const sessionId = useMemo(() => sessionStore.getCurrent(), []);
  const [reviewError, setReviewError] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['order-detail', params.id, sessionId],
    queryFn: async (): Promise<OrderDetailResponse> => {
      const res = await fetch(
        `/api/orders/${params.id}?sessionId=${encodeURIComponent(sessionId)}`,
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || 'Không thể tải chi tiết đơn hàng.');
      return json;
    },
    enabled: Boolean(params.id),
  });

  const submitReview = async (rating: number, comment: string) => {
    setReviewError('');
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        order_id: params.id,
        rating,
        comment,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setReviewError(json?.message || 'Không thể gửi đánh giá.');
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: ['order-detail', params.id, sessionId],
    });
  };

  const discountAmount = Math.max(0, data?.order.discount_amount ?? 0);
  const payableAmount = Math.max(0, (data?.order.total_amount ?? 0) - discountAmount);

  return (
    <>
      <Header />
      <main className="container-shell py-8">
        <h1 className="text-3xl font-semibold">Chi tiết đơn hàng</h1>
        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Đang tải chi tiết đơn hàng...
          </p>
        ) : null}
        {isError ? (
          <p className="mt-4 text-sm text-destructive">
            {(error as Error).message}
          </p>
        ) : null}
        {data ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr,1fr]">
            <div className="space-y-4">
              <section className="card-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mã đơn: {data.order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass(data.order.status)}`}
                  >
                    {statusLabel(data.order.status)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTimeVi(data.order.created_at)}
                </p>
                <p className="mt-2 font-semibold">
                  Tổng tiền món: {formatCurrency(data.order.total_amount)}
                </p>
                {discountAmount > 0 ? (
                  <p className="mt-1 font-semibold text-primary">
                    Giảm giá: - {formatCurrency(discountAmount)}
                  </p>
                ) : null}
                <p className="mt-1 font-semibold">
                  Thành tiền sau giảm: {formatCurrency(payableAmount)}
                </p>
              </section>
              <section className="card-surface p-4">
                <h2 className="text-lg font-semibold">Món đã đặt</h2>
                <div className="mt-3 space-y-2">
                  {data.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b border-border pb-2 text-sm"
                    >
                      <div>
                        <p>
                          {item.menu_variant?.menu_item?.name ?? 'Món ăn'} -{' '}
                          {item.menu_variant?.name ?? 'Biến thể'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <strong>
                        {formatCurrency(item.quantity * item.unit_price)}
                      </strong>
                    </div>
                  ))}
                </div>
              </section>
              <section className="card-surface p-4">
                <h2 className="text-lg font-semibold">Lịch sử trạng thái</h2>
                <div className="mt-3 space-y-2 text-sm">
                  {data.logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between"
                    >
                      <span>{statusLabel(log.status)}</span>
                      <span className="text-muted-foreground">
                        {formatDateTimeVi(log.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <div className="space-y-4">
              {data.review ? (
                <div className="card-surface p-4">
                  <h3 className="text-lg font-semibold">Đánh giá của bạn</h3>
                  <p className="mt-2 text-sm">Điểm: {data.review.rating}/5</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.review.comment}
                  </p>
                </div>
              ) : (
                <ReviewForm
                  onSubmit={submitReview}
                  disabled={data.order.status !== 'delivered'}
                />
              )}
              {reviewError ? (
                <p className="text-sm text-destructive">{reviewError}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
