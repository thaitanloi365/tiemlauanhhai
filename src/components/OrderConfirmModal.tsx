'use client';

import { formatCurrency } from '@/lib/utils/format';
import type { OrderFormValues } from '@/components/OrderForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  form: OrderFormValues;
  lines: AppTypes.CartLine[];
  totalAmount: number;
  discountAmount?: number;
  promotionCode?: string;
  scheduledDateLabel?: string;
  scheduledSlotLabel?: string;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function OrderConfirmModal({
  open,
  form,
  lines,
  totalAmount,
  discountAmount = 0,
  promotionCode,
  scheduledDateLabel,
  scheduledSlotLabel,
  submitting,
  onCancel,
  onConfirm,
}: Props) {
  const payableAmount = Math.max(0, totalAmount - discountAmount);
  const restaurantNotes = [
    ...new Set(lines.map((line) => line.itemNote?.trim()).filter(Boolean)),
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !submitting && onCancel()}
    >
      <DialogContent
        className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-2xl p-4 sm:p-5"
        onInteractOutside={(event) => {
          if (submitting) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (submitting) event.preventDefault();
        }}
        showCloseButton={!submitting}
      >
        <DialogHeader>
          <DialogTitle>Xác nhận thông tin đơn hàng</DialogTitle>
          <DialogDescription>
            Kiểm tra lại thông tin trước khi gửi đơn để quán xử lý nhanh hơn.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4 text-sm">
          <section className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="font-medium">Thông tin khách hàng</p>
            <p className="mt-1">
              Họ tên: <strong>{form.customer_name}</strong>
            </p>
            <p>
              SĐT: <strong>{form.phone}</strong>
            </p>
            {form.email ? (
              <p>
                Email: <strong>{form.email}</strong>
              </p>
            ) : null}
            <p>
              Địa chỉ:{' '}
              <strong>
                {form.address}, {form.ward}, {form.district}, {form.province}
              </strong>
            </p>
            <p>
              Ngày nhận món:{' '}
              <strong>{scheduledDateLabel || form.scheduled_date}</strong>
            </p>
            <p>
              Khung giờ nhận món:{' '}
              <strong>{scheduledSlotLabel || form.scheduled_slot}</strong>
            </p>
          </section>
          <section className="rounded-xl border border-border p-3">
            <p className="font-medium">Chi tiết đơn hàng</p>
            <div className="mt-2 space-y-2">
              {lines.map((line) => (
                <div
                  key={line.variantId}
                  className="flex items-start justify-between gap-3"
                >
                  <div>
                    <p>
                      {line.itemName} - {line.variantName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {line.quantity} x {formatCurrency(line.price)}
                    </p>
                  </div>
                  <strong>{formatCurrency(line.price * line.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-border pt-2">
              {discountAmount > 0 ? (
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Giảm giá{promotionCode ? ` (${promotionCode})` : ''}
                  </span>
                  <strong className="text-primary">- {formatCurrency(discountAmount)}</strong>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold">Tổng tiền món</span>
                <strong className="text-primary">
                  {formatCurrency(totalAmount)}
                </strong>
              </div>
              <div className="mt-1 flex items-center justify-between text-base">
                <span className="font-semibold">Thanh toán</span>
                <strong className="text-primary">{formatCurrency(payableAmount)}</strong>
              </div>
            </div>
          </section>
          {form.note ? (
            <section className="rounded-xl border border-border p-3">
              <p className="font-medium">Ghi chú của khách</p>
              <p className="mt-1 text-muted-foreground">{form.note}</p>
            </section>
          ) : null}
          {restaurantNotes.length > 0 ? (
            <section className="rounded-xl border border-border bg-muted p-3">
              <p className="font-medium text-foreground">Lưu ý từ nhà hàng</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-foreground">
                {restaurantNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <DialogFooter className="mt-5 border-t border-border pt-4 sm:justify-end">
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={submitting}
          >
            Quay lại chỉnh sửa
          </Button>
          <Button type="button" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Đang tạo đơn...' : 'Đặt hàng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
