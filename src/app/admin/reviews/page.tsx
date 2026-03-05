'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { parseAsString, useQueryStates } from 'nuqs';
import { getReviewEmotionByRating } from '@/lib/constants/review';
import { statusLabel } from '@/lib/utils/format';
import { formatDateTimeVi } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AdminReview = AppTypes.Review & {
  order: Pick<
    AppTypes.Order,
    'id' | 'customer_name' | 'phone' | 'status' | 'total_amount' | 'created_at'
  > | null;
};

export default function AdminReviewsPage() {
  const [f, setF] = useQueryStates({
    q: parseAsString.withDefault(''),
    s: parseAsString.withDefault(''),
    p: parseAsString.withDefault(''),
    o: parseAsString.withDefault('newest'),
    c: parseAsString.withDefault(''),
  });

  const reviewsQuery = useQuery({
    queryKey: ['admin', 'reviews', f.q, f.s, f.p, f.o, f.c],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (f.q) params.set('q', f.q.trim());
      if (f.s) params.set('status', f.s);
      if (f.p) params.set('rating', f.p);
      if (f.o) params.set('sort', f.o);
      if (f.c) params.set('orderId', f.c.trim());
      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = (await res.json()) as { reviews?: AdminReview[]; message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Không tải được danh sách đánh giá');
      return data.reviews ?? [];
    },
  });

  return (
    <div className="container-shell space-y-4">
      <h1 className="text-3xl font-bold">Quản lý đánh giá khách hàng</h1>

      <div className="grid gap-2 md:grid-cols-5">
        <Input
          placeholder="Tìm theo nội dung/tên/SĐT"
          value={f.q}
          onChange={(event) => setF({ q: event.target.value })}
        />
        <Input
          placeholder="Mã đơn hàng"
          value={f.c}
          onChange={(event) => setF({ c: event.target.value })}
        />
        <Select value={f.s || 'all'} onValueChange={(value) => setF({ s: value === 'all' ? '' : value })}>
          <SelectTrigger>
            <SelectValue placeholder="Trạng thái đơn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chờ xác nhận</SelectItem>
            <SelectItem value="confirmed">Đã xác nhận</SelectItem>
            <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
            <SelectItem value="shipping">Đang giao</SelectItem>
            <SelectItem value="delivered">Đã giao</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
        <Select value={f.p || 'all'} onValueChange={(value) => setF({ p: value === 'all' ? '' : value })}>
          <SelectTrigger>
            <SelectValue placeholder="Mức đánh giá" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả mức</SelectItem>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="1">1</SelectItem>
          </SelectContent>
        </Select>
        <Select value={f.o || 'newest'} onValueChange={(value) => setF({ o: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="oldest">Cũ nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reviewsQuery.isLoading ? (
        <p className="rounded-md border p-4 text-sm text-muted-foreground">Đang tải...</p>
      ) : reviewsQuery.isError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {(reviewsQuery.error as Error).message}
        </p>
      ) : (reviewsQuery.data ?? []).length === 0 ? (
        <p className="rounded-md border p-4 text-sm text-muted-foreground">Chưa có đánh giá nào.</p>
      ) : (
        <div className="space-y-3">
          {(reviewsQuery.data ?? []).map((review) => (
            <div key={review.id} className="rounded-md border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold">
                    {getReviewEmotionByRating(review.rating).emoji}{' '}
                    {getReviewEmotionByRating(review.rating).label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTimeVi(review.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/orders/${review.order_id}`}>Xem đơn</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/chat?oid=${review.order_id}`}>Mở chat</Link>
                  </Button>
                </div>
              </div>
              <p className="mt-3 text-sm">{review.comment || 'Không có nội dung nhận xét.'}</p>
              {review.order ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Đơn #{review.order.id.slice(0, 8).toUpperCase()} - {review.order.customer_name} -{' '}
                  {review.order.phone} - {statusLabel(review.order.status)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
