'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Smile } from 'lucide-react';
import { parseAsString, useQueryStates } from 'nuqs';
import { ChatBox } from '@/components/ChatBox';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { browserSupabase, hasSupabaseBrowserConfig } from '@/lib/supabase';
import { statusClass, statusLabel } from '@/lib/utils/format';
import { formatDateTimeVi } from '@/lib/date';
import { isChatReadonlyByOrderStatus } from '@/lib/constants/chat';
import { getReviewEmotionByRating } from '@/lib/constants/review';

type Conversation = {
  order: Pick<
    AppTypes.Order,
    | 'id'
    | 'customer_name'
    | 'phone'
    | 'address'
    | 'province'
    | 'district'
    | 'ward'
    | 'total_amount'
    | 'discount_amount'
    | 'status'
    | 'created_at'
  >;
  latest_message: Pick<
    AppTypes.OrderMessage,
    'id' | 'sender_type' | 'content' | 'images' | 'created_at'
  >;
  message_count: number;
  has_unread_for_admin: boolean;
};

type AdminChatResponse = {
  conversations: Conversation[];
};

type OrderDetailResponse = {
  order: AppTypes.Order;
  items: AppTypes.OrderItem[];
  review: AppTypes.Review | null;
};

export default function AdminChatPage() {
  const queryClient = useQueryClient();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [f, setF] = useQueryStates({
    o: parseAsString.withDefault(''),
  });

  const conversationsQuery = useQuery({
    queryKey: ['admin', 'chat', 'conversations'],
    queryFn: async () => {
      const res = await fetch('/api/admin/chat');
      const data = (await res.json()) as AdminChatResponse & { message?: string };
      if (!res.ok) {
        throw new Error(data.message ?? 'Không tải được danh sách chat');
      }
      return data.conversations ?? [];
    },
  });
  const availableOrderIds = (conversationsQuery.data ?? []).map((item) => item.order.id);
  const fallbackOrderId = conversationsQuery.data?.[0]?.order.id ?? '';
  const activeOrderId =
    f.o && availableOrderIds.includes(f.o) ? f.o : fallbackOrderId;

  const orderDetailQuery = useQuery({
    queryKey: ['admin', 'chat', 'order-detail', activeOrderId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${activeOrderId}`);
      const data = (await res.json()) as OrderDetailResponse & { message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Không tải được chi tiết đơn');
      return data;
    },
    enabled: Boolean(activeOrderId),
  });

  useEffect(() => {
    if (!hasSupabaseBrowserConfig()) return;

    const channel = browserSupabase
      .channel('admin-chat:conversation-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_messages' },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ['admin', 'chat', 'conversations'],
          });
          if (activeOrderId) {
            void queryClient.invalidateQueries({
              queryKey: ['admin', 'chat', 'order-detail', activeOrderId],
            });
          }
        },
      )
      .subscribe();

    return () => {
      void browserSupabase.removeChannel(channel);
    };
  }, [queryClient, activeOrderId]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const selectedConversation = useMemo(
    () =>
      (conversationsQuery.data ?? []).find(
        (conversation) => conversation.order.id === activeOrderId,
      ),
    [conversationsQuery.data, activeOrderId],
  );

  const selectedOrder = orderDetailQuery.data?.order ?? selectedConversation?.order;

  return (
    <div className="container-shell space-y-4">
      <h1 className="text-3xl font-bold">Quản lý chat đơn hàng</h1>
      <section className="rounded-md border border-border bg-card">
        <div className="border-b px-4 py-3">
          <p className="font-semibold">Danh sách chat</p>
          <p className="text-xs text-muted-foreground">
            Chỉ hiện đơn hàng đã có tin nhắn.
          </p>
        </div>
        <div className="max-h-[72vh] overflow-y-auto">
          {conversationsQuery.isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Đang tải...</p>
          ) : conversationsQuery.isError ? (
            <p className="p-4 text-sm text-destructive">
              {(conversationsQuery.error as Error).message}
            </p>
          ) : (conversationsQuery.data ?? []).length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Chưa có cuộc chat nào.</p>
          ) : (
            (conversationsQuery.data ?? []).map((conversation) => {
              const active = activeOrderId === conversation.order.id;
              const latestMessageText =
                conversation.latest_message.content?.trim() ||
                (conversation.latest_message.images?.length
                  ? `[${conversation.latest_message.images.length} ảnh]`
                  : '(Tin nhắn trống)');
              return (
                <button
                  key={conversation.order.id}
                  type="button"
                  className={`w-full border-b px-4 py-3 text-left transition hover:bg-muted/60 ${
                    active ? 'bg-muted' : ''
                  }`}
                  onClick={() => {
                    setF({ o: conversation.order.id });
                    setChatDrawerOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {conversation.order.customer_name}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass(conversation.order.status)}`}
                    >
                      {statusLabel(conversation.order.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{conversation.order.phone}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {latestMessageText}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    {conversation.has_unread_for_admin ? (
                      <p className="text-xs font-semibold text-destructive">
                        Có tin nhắn chưa đọc
                      </p>
                    ) : (
                      <span />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDateTimeVi(conversation.latest_message.created_at)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {isDesktop ? (
        <Sheet open={chatDrawerOpen} onOpenChange={setChatDrawerOpen}>
          <SheetContent
            side="right"
            className="my-3 mr-3 flex h-[calc(100dvh-1.5rem)] w-[min(920px,calc(100vw-1.5rem))] max-w-none flex-col overflow-hidden rounded-2xl border p-4 sm:max-w-none"
          >
            <SheetHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <SheetTitle>Chat với khách hàng</SheetTitle>
                  <SheetDescription>
                    {selectedOrder
                      ? `#${selectedOrder.id.slice(0, 8).toUpperCase()} - ${selectedOrder.customer_name}`
                      : 'Hội thoại đơn hàng'}
                  </SheetDescription>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Xem đánh giá đơn hàng"
                  title="Xem đánh giá"
                  disabled={!orderDetailQuery.data?.review}
                  onClick={() => setReviewOpen(true)}
                >
                  <Smile />
                </Button>
              </div>
              {selectedOrder ? (
                <p className="text-xs text-muted-foreground">
                  {statusLabel(selectedOrder.status)} - {selectedOrder.phone}
                </p>
              ) : null}
            </SheetHeader>
            <div className="mt-3 min-h-0 flex-1 overflow-hidden px-1 pb-1">
              {activeOrderId ? (
                <ChatBox
                  orderId={activeOrderId}
                  senderType="admin"
                  readonly={
                    selectedOrder
                      ? isChatReadonlyByOrderStatus(selectedOrder.status)
                      : false
                  }
                  title="Chat với khách hàng"
                />
              ) : (
                <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                  Chọn một hội thoại để bắt đầu.
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer open={chatDrawerOpen} onOpenChange={setChatDrawerOpen}>
          <DrawerContent className="max-h-[92vh]">
            <DrawerHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <DrawerTitle>Chat với khách hàng</DrawerTitle>
                  <DrawerDescription>
                    {selectedOrder
                      ? `#${selectedOrder.id.slice(0, 8).toUpperCase()} - ${selectedOrder.customer_name}`
                      : 'Hội thoại đơn hàng'}
                  </DrawerDescription>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Xem đánh giá đơn hàng"
                  title="Xem đánh giá"
                  disabled={!orderDetailQuery.data?.review}
                  onClick={() => setReviewOpen(true)}
                >
                  <Smile />
                </Button>
              </div>
              {selectedOrder ? (
                <p className="text-xs text-muted-foreground">
                  {statusLabel(selectedOrder.status)} - {selectedOrder.phone}
                </p>
              ) : null}
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-hidden px-1 pb-1">
              {activeOrderId ? (
                <ChatBox
                  orderId={activeOrderId}
                  senderType="admin"
                  readonly={
                    selectedOrder
                      ? isChatReadonlyByOrderStatus(selectedOrder.status)
                      : false
                  }
                  title="Chat với khách hàng"
                />
              ) : (
                <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                  Chọn một hội thoại để bắt đầu.
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <Drawer open={reviewOpen} onOpenChange={setReviewOpen}>
        <DrawerContent className="max-h-[82vh]">
          <DrawerHeader>
            <DrawerTitle>Đánh giá đơn hàng</DrawerTitle>
            <DrawerDescription>
              {selectedOrder
                ? `Mã đơn ${selectedOrder.id.slice(0, 8).toUpperCase()}`
                : 'Đơn hàng'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-1 pb-2">
            {orderDetailQuery.data?.review ? (
              <div className="rounded-md border border-border bg-muted/40 p-4">
                <p className="text-2xl">
                  {getReviewEmotionByRating(orderDetailQuery.data.review.rating).emoji}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getReviewEmotionByRating(orderDetailQuery.data.review.rating).label}
                </p>
                <p className="mt-2 text-sm">
                  {orderDetailQuery.data.review.comment ||
                    'Khách chưa để lại nhận xét.'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                Đơn hàng này chưa có đánh giá từ khách.
              </div>
            )}
          </div>
          <DrawerFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewOpen(false)}
            >
              Đóng
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
