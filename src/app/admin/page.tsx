'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Smile } from 'lucide-react';
import { ChatBox } from '@/components/ChatBox';
import {
  formatCurrency,
  statusBadgeVariant,
  statusLabel,
} from '@/lib/utils/format';
import { formatDateTimeVi } from '@/lib/date';
import { isChatReadonlyByOrderStatus } from '@/lib/constants/chat';
import { getReviewEmotionByRating } from '@/lib/constants/review';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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
    has_review?: boolean;
    has_unread_for_admin?: boolean;
  }>;
};

export default function AdminDashboardPage() {
  const [visibleCount, setVisibleCount] = useState(6);
  const [isDesktop, setIsDesktop] = useState(false);
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

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

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
                <AdminDashboardOrderCard
                  key={order.id}
                  order={order}
                  isDesktop={isDesktop}
                />
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

type DashboardOrder = DashboardResponse['orders'][number];

function AdminDashboardOrderCard({
  order,
  isDesktop,
}: {
  order: DashboardOrder;
  isDesktop: boolean;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const reviewQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'order-review', order.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${order.id}`);
      const data = (await res.json()) as {
        message?: string;
        order?: AppTypes.Order;
        review?: AppTypes.Review | null;
      };
      if (!res.ok) {
        throw new Error(data.message ?? 'Không tải được đánh giá của đơn.');
      }
      return {
        review: data.review ?? null,
        order: data.order ?? null,
      };
    },
    enabled: reviewOpen,
  });

  const detailOrder = reviewQuery.data?.order;

  return (
    <>
      <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm transition hover:bg-muted">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/admin/orders/${order.id}`}
            className="font-semibold text-foreground underline"
          >
            #{order.id.slice(0, 8).toUpperCase()}
          </Link>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="relative"
              aria-label="Mở chat đơn hàng"
              title="Mở chat"
              onClick={() => setChatOpen(true)}
            >
              <MessageCircle />
              {order.has_unread_for_admin ? (
                <>
                  <span className="pointer-events-none absolute right-1 top-1 size-2 rounded-full bg-primary motion-safe:animate-bounce" />
                  <span className="pointer-events-none absolute right-0.5 top-0.5 size-3 rounded-full border border-primary/60 motion-safe:animate-ping" />
                </>
              ) : null}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Xem đánh giá đơn hàng"
              title="Xem đánh giá"
              onClick={() => setReviewOpen(true)}
            >
              <Smile />
            </Button>
            <Badge variant={statusBadgeVariant(order.status)}>
              {statusLabel(order.status)}
            </Badge>
          </div>
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
            {formatDateTimeVi(order.created_at)}
          </p>
        </div>
      </div>

      {isDesktop ? (
        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetContent
            side="right"
            className="my-3 mr-3 flex h-[calc(100dvh-1.5rem)] w-[min(760px,calc(100vw-1.5rem))] max-w-none flex-col overflow-hidden rounded-2xl border p-4 sm:max-w-none"
          >
            <SheetHeader>
              <SheetTitle>Chat với khách hàng</SheetTitle>
              <SheetDescription>
                Mã đơn {order.id.slice(0, 8).toUpperCase()} -{' '}
                {order.customer_name}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-3 min-h-0 flex-1 overflow-hidden px-1 pb-1">
              <ChatBox
                orderId={order.id}
                senderType="admin"
                readonly={isChatReadonlyByOrderStatus(
                  detailOrder?.status ?? order.status,
                )}
                title="Chat với khách hàng"
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer open={chatOpen} onOpenChange={setChatOpen}>
          <DrawerContent className="max-h-[92vh]">
            <DrawerHeader>
              <DrawerTitle>Chat với khách hàng</DrawerTitle>
              <DrawerDescription>
                Mã đơn {order.id.slice(0, 8).toUpperCase()} -{' '}
                {order.customer_name}
              </DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-hidden px-1 pb-1">
              <ChatBox
                orderId={order.id}
                senderType="admin"
                readonly={isChatReadonlyByOrderStatus(
                  detailOrder?.status ?? order.status,
                )}
                title="Chat với khách hàng"
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="flex max-h-[82vh] w-[min(560px,calc(100vw-2rem))] flex-col overflow-hidden p-0 sm:max-w-none">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Đánh giá đơn hàng</DialogTitle>
            <DialogDescription>
              Mã đơn {order.id.slice(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
            {reviewQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Đang tải đánh giá...
              </p>
            ) : reviewQuery.isError ? (
              <p className="text-sm text-destructive">
                {reviewQuery.error.message}
              </p>
            ) : reviewQuery.data?.review ? (
              <div className="rounded-md border border-border bg-muted/40 p-4">
                <p className="text-2xl">
                  {
                    getReviewEmotionByRating(reviewQuery.data.review.rating)
                      .emoji
                  }
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {
                    getReviewEmotionByRating(reviewQuery.data.review.rating)
                      .label
                  }
                </p>
                <p className="mt-2 text-sm">
                  {reviewQuery.data.review.comment ||
                    'Khách chưa để lại nhận xét.'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                Đơn hàng này chưa có đánh giá từ khách.
              </div>
            )}
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
