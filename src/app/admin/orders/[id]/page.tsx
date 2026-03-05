'use client';

import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { MessageCircle, Smile } from 'lucide-react';
import { ORDER_STATUS_VALUES } from '@/lib/constants/order';
import {
  addHoursInTz,
  formatLocaleDate,
  formatLocaleTime,
  formatDateTimeVi,
} from '@/lib/date';
import { formatCurrency, statusLabel } from '@/lib/utils/format';
import { adminOrderUpdateSchema } from '@/lib/schemas';
import { isChatReadonlyByOrderStatus } from '@/lib/constants/chat';
import { getReviewEmotionByRating } from '@/lib/constants/review';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChatBox } from '@/components/ChatBox';
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
    email: string | null;
    address: string;
    province: string;
    district: string;
    ward: string;
    note: string | null;
    scheduled_for: string | null;
    total_amount: number;
    discount_amount: number;
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
  review: AppTypes.Review | null;
  has_chat?: boolean;
  has_unread_for_admin?: boolean;
};

const adminOrderUpdateFormSchema = adminOrderUpdateSchema.extend({
  tracking_id: z.string().max(120),
  tracking_url: z
    .string()
    .refine(
      (value) => value.trim() === '' || /^https?:\/\/.+/i.test(value.trim()),
      'Tracking URL không hợp lệ',
    )
    .refine((value) => value.length <= 500, 'Tracking URL không hợp lệ'),
});

type AdminOrderUpdateFormValues = z.infer<typeof adminOrderUpdateFormSchema>;

function formatScheduledFor(value: string | null | undefined) {
  if (!value) return null;
  const end = addHoursInTz(value, 2).toDate();
  const dateLabel = formatLocaleDate(value, 'vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const startLabel = formatLocaleTime(value, 'vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const endLabel = formatLocaleTime(end, 'vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${dateLabel} (${startLabel} - ${endLabel})`;
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminOrderUpdateFormValues>({
    resolver: zodResolver(adminOrderUpdateFormSchema),
    defaultValues: {
      status: 'pending',
      tracking_id: '',
      tracking_url: '',
    },
  });

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
  const discountAmount = Math.max(0, order?.discount_amount ?? 0);
  const payableAmount = Math.max(
    0,
    (order?.total_amount ?? 0) - discountAmount,
  );

  useEffect(() => {
    if (!order) return;
    reset({
      status: order.status as AdminOrderUpdateFormValues['status'],
      tracking_id: order.tracking_id ?? '',
      tracking_url: order.tracking_url ?? '',
    });
  }, [order, reset]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  async function save(values: AdminOrderUpdateFormValues) {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status: values.status,
          tracking_id: values.tracking_id.trim() || null,
          tracking_url: values.tracking_url.trim() || null,
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
    } catch {
      setMessage('Không thể cập nhật');
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
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="relative"
                aria-label="Mở chat đơn hàng"
                title="Mở chat"
                onClick={() => setChatOpen(true)}
              >
                <MessageCircle />
                {detailQuery.data?.has_unread_for_admin ? (
                  <>
                    <span className="pointer-events-none absolute right-1 top-1 size-2 rounded-full bg-primary motion-safe:animate-bounce" />
                    <span className="pointer-events-none absolute right-0.5 top-0.5 size-3 rounded-full border border-primary/60 motion-safe:animate-ping" />
                  </>
                ) : null}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Xem đánh giá đơn hàng"
                title="Xem đánh giá"
                disabled={!detailQuery.data?.review}
                onClick={() => setReviewOpen(true)}
              >
                <Smile />
              </Button>
            </div>
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
              {order.email ? (
                <div className="rounded-xl border border-border bg-muted p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {order.email}
                  </p>
                </div>
              ) : null}
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
            <form
              className="mt-4 space-y-2"
              onSubmit={handleSubmit(save)}
              noValidate
            >
              <div className="grid gap-1 text-sm">
                <Label>Trạng thái</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUS_VALUES.map((option) => (
                          <SelectItem key={option} value={option}>
                            {statusLabel(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status?.message ? (
                  <p className="text-xs text-destructive">
                    {errors.status.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-1 text-sm">
                <Label>Tracking ID</Label>
                <Input {...register('tracking_id')} />
                {errors.tracking_id?.message ? (
                  <p className="text-xs text-destructive">
                    {errors.tracking_id.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-1 text-sm">
                <Label>Tracking URL</Label>
                <Input {...register('tracking_url')} />
                {errors.tracking_url?.message ? (
                  <p className="text-xs text-destructive">
                    {errors.tracking_url.message}
                  </p>
                ) : null}
              </div>
              <Button type="submit" disabled={isSubmitting} className="mt-4">
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </form>
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
            {discountAmount > 0 ? (
              <div className="mt-2 flex items-center justify-between">
                <span className="font-medium">Giảm giá</span>
                <span className="font-semibold text-primary">
                  - {formatCurrency(discountAmount)}
                </span>
              </div>
            ) : null}
            <div className="mt-2 flex items-center justify-between">
              <span className="font-medium">Thành tiền sau giảm</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(payableAmount)}
              </span>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Timeline trạng thái</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {detailQuery.data?.logs.map((log, index) => (
                <li
                  key={`${log.created_at}-${index}`}
                  className="rounded-lg bg-muted p-2"
                >
                  {statusLabel(log.status)} - {formatDateTimeVi(log.created_at)}
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
      {order ? (
        <>
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
                    orderId={params.id}
                    senderType="admin"
                    readonly={isChatReadonlyByOrderStatus(order.status)}
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
                    orderId={params.id}
                    senderType="admin"
                    readonly={isChatReadonlyByOrderStatus(order.status)}
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
                {detailQuery.data?.review ? (
                  <div className="rounded-md border border-border bg-muted/40 p-4">
                    <p className="text-2xl">
                      {
                        getReviewEmotionByRating(detailQuery.data.review.rating)
                          .emoji
                      }
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {
                        getReviewEmotionByRating(detailQuery.data.review.rating)
                          .label
                      }
                    </p>
                    <p className="mt-2 text-sm">
                      {detailQuery.data.review.comment ||
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
      ) : null}
    </div>
  );
}
