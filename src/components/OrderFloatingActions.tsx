'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Smile } from 'lucide-react';
import { ChatBox } from '@/components/ChatBox';
import { ReviewForm } from '@/components/ReviewForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getReviewEmotionByRating } from '@/lib/constants/review';
import { useOrderChat } from '@/lib/hooks/use-order-chat';

type OrderFloatingActionsProps = {
  orderId: string;
  sessionId: string;
  orderStatus: AppTypes.OrderStatus;
  review: AppTypes.Review | null;
  onSubmitReview: (rating: number, comment: string) => Promise<void>;
};

export function OrderFloatingActions({
  orderId,
  sessionId,
  orderStatus,
  review,
  onSubmitReview,
}: OrderFloatingActionsProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [showThanks, setShowThanks] = useState(false);
  const canReview = orderStatus === 'delivered';

  const customerChat = useOrderChat({
    orderId,
    actor: { role: 'customer', sessionId },
  });
  const { hasUnread, markAsRead } = customerChat;

  useEffect(() => {
    if (!chatOpen) return;
    if (!hasUnread) return;
    void markAsRead().catch(() => undefined);
  }, [chatOpen, hasUnread, markAsRead]);

  const submitReview = async (rating: number, comment: string) => {
    setReviewError('');
    try {
      await onSubmitReview(rating, comment);
      setShowThanks(true);
    } catch (error) {
      setReviewError((error as Error).message || 'Không thể gửi đánh giá');
    }
  };

  const closeReviewDialog = () => {
    setReviewOpen(false);
    setShowThanks(false);
    setReviewError('');
  };

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 md:bottom-6">
        {canReview ? (
          <Button
            type="button"
            size="icon"
            className="relative size-12 rounded-full shadow-lg"
            variant="outline"
            onClick={() => setReviewOpen(true)}
            aria-label="Đánh giá đơn hàng"
          >
            <Smile className="size-5" />
          </Button>
        ) : null}
        <Button
          type="button"
          size="icon"
          className="relative size-14 rounded-full shadow-xl"
          onClick={() => setChatOpen(true)}
          aria-label="Mở chat đơn hàng"
        >
          <MessageCircle className="size-6" />
          {hasUnread ? (
            <span className="absolute right-1 top-1 inline-flex size-3 items-center justify-center rounded-full bg-amber-300 ring-2 ring-background">
              <span className="size-1.5 rounded-full bg-amber-700" />
            </span>
          ) : null}
        </Button>
      </div>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="top-auto! left-auto! right-4! bottom-20! h-[80vh]! w-[calc(100vw-2rem)]! max-w-[460px]! translate-x-0! translate-y-0! grid-rows-[auto,1fr]! p-3 sm:bottom-6! sm:right-6!">
          <div className="min-h-0 overflow-hidden">
            <ChatBox
              key={orderId}
              title="Chat với admin"
              orderId={orderId}
              senderType="customer"
              sessionId={sessionId}
              readonly={
                orderStatus === 'delivered' || orderStatus === 'cancelled'
              }
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Đánh giá đơn hàng</DialogTitle>
            <DialogDescription>
              Cảm ơn bạn đã đặt món. Ý kiến của bạn giúp tiệm phục vụ tốt hơn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {showThanks ? (
              <div className="rounded-md border border-border bg-muted/40 p-4 text-center">
                <p className="text-lg font-semibold">Cảm ơn bạn đã đánh giá!</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tiệm Lẩu Anh Hai rất trân trọng góp ý của bạn.
                </p>
              </div>
            ) : review ? (
              <div className="rounded-md border border-border bg-muted/40 p-4">
                <p className="text-2xl">
                  {getReviewEmotionByRating(review.rating).emoji}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getReviewEmotionByRating(review.rating).label}
                </p>
                <p className="mt-2 text-sm">
                  {review.comment || 'Bạn chưa để lại nhận xét.'}
                </p>
              </div>
            ) : (
              <ReviewForm onSubmit={submitReview} disabled={!canReview} />
            )}
            {reviewError ? (
              <p className="text-sm text-destructive">{reviewError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeReviewDialog}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
