'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Cart } from '@/components/Cart';
import {
  OrderForm,
  type OrderFormValues,
  useOrderForm,
} from '@/components/OrderForm';
import { OrderConfirmModal } from '@/components/OrderConfirmModal';
import { BottomNav } from '@/components/BottomNav';
import { useCartStore, selectCartTotal } from '@/lib/stores/cart';
import { sessionStore } from '@/lib/stores/session';
import { SCHEDULED_SLOT_OPTIONS } from '@/lib/constants/order';
import {
  addDaysInTz,
  formatDateOnlyInTz,
  formatLocaleDate,
  now as dayjsNow,
} from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils/format';

function nextSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDaysInTz(dayjsNow().valueOf(), index);
    const value = formatDateOnlyInTz(date.toDate());
    const label = formatLocaleDate(date.toDate(), 'vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
    });
    return { value, label };
  });
}

type MenuRuleItem = {
  id: string;
  name: string;
  is_main_dish?: boolean;
  block_today?: boolean;
  block_today_reason?: string | null;
  block_tomorrow?: boolean;
  block_tomorrow_reason?: string | null;
  blocked_delivery_dates?: string[] | null;
  blocked_delivery_date_reasons?: Record<string, string> | null;
};

type PromotionMessageTone = 'neutral' | 'error' | 'success';

export default function CartPage() {
  const router = useRouter();
  const form = useOrderForm();
  const lines = useCartStore((state) => state.lines);
  const clear = useCartStore((state) => state.clear);
  const totalAmount = useCartStore(selectCartTotal);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmValues, setConfirmValues] = useState<OrderFormValues | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [promotionCode, setPromotionCode] = useState('');
  const [appliedPromotionCode, setAppliedPromotionCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promotionBaseAmount, setPromotionBaseAmount] = useState(0);
  const [promotionBaseLineCount, setPromotionBaseLineCount] = useState(0);
  const [promotionMessage, setPromotionMessage] = useState('');
  const [promotionMessageTone, setPromotionMessageTone] =
    useState<PromotionMessageTone>('neutral');
  const dateOptions = useMemo(() => nextSevenDays(), []);
  const todayDateValue = dateOptions[0]?.value ?? '';
  const tomorrowDateValue = dateOptions[1]?.value ?? '';
  const scheduledDate = form.watch('scheduled_date');

  const menuRulesQuery = useQuery({
    queryKey: ['menu-rules'],
    queryFn: async () => {
      const response = await fetch('/api/menu', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? 'Không tải được dữ liệu món ăn.');
      }
      return (data?.menuItems ?? []) as MenuRuleItem[];
    },
    enabled: lines.length > 0,
  });

  const menuItemById = useMemo(
    () => new Map((menuRulesQuery.data ?? []).map((item) => [item.id, item])),
    [menuRulesQuery.data],
  );

  const hasMainDish = useMemo(
    () =>
      lines.some((line) => menuItemById.get(line.itemId)?.is_main_dish === true),
    [lines, menuItemById],
  );
  const isPromotionStale =
    promotionBaseAmount !== totalAmount || promotionBaseLineCount !== lines.length;
  const activePromotionCode = isPromotionStale ? '' : appliedPromotionCode;
  const activeDiscountAmount = isPromotionStale ? 0 : discountAmount;

  const disabledDateReasons = useMemo(() => {
    if (lines.length === 0) return {};
    const selectedDates = new Set(dateOptions.map((option) => option.value));
    const reasonsByDate = new Map<string, Set<string>>();

    for (const line of lines) {
      const menuItem = menuItemById.get(line.itemId);
      if (!menuItem || menuItem.is_main_dish !== true) continue;
      const itemLabel = menuItem.name;
      const todayReason =
        menuItem.block_today_reason?.trim() ||
        `Món "${itemLabel}" đang tạm ngưng giao hôm nay.`;
      if (menuItem.block_today && todayDateValue) {
        const reasons = reasonsByDate.get(todayDateValue) ?? new Set<string>();
        reasons.add(todayReason);
        reasonsByDate.set(todayDateValue, reasons);
      }
      const tomorrowReason =
        menuItem.block_tomorrow_reason?.trim() ||
        `Món "${itemLabel}" đang tạm ngưng giao trong ngày mai.`;
      if (menuItem.block_tomorrow && tomorrowDateValue) {
        const reasons = reasonsByDate.get(tomorrowDateValue) ?? new Set<string>();
        reasons.add(tomorrowReason);
        reasonsByDate.set(tomorrowDateValue, reasons);
      }
      for (const blockedDate of menuItem.blocked_delivery_dates ?? []) {
        if (!selectedDates.has(blockedDate)) continue;
        const reasonForDate = menuItem.blocked_delivery_date_reasons?.[
          blockedDate
        ]?.trim();
        const reasons = reasonsByDate.get(blockedDate) ?? new Set<string>();
        reasons.add(reasonForDate || `Món "${itemLabel}" không giao trong ngày này.`);
        reasonsByDate.set(blockedDate, reasons);
      }
    }

    const nextReasons: Record<string, string> = {};
    for (const [dateValue, reasons] of reasonsByDate.entries()) {
      nextReasons[dateValue] = Array.from(reasons).join(' ');
    }
    return nextReasons;
  }, [dateOptions, lines, menuItemById, todayDateValue, tomorrowDateValue]);

  const createOrderMutation = useMutation({
    mutationFn: async (values: OrderFormValues) => {
      const session_id = sessionStore.getCurrent();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          session_id,
          customer_name: values.customer_name,
          phone: values.phone,
          email: values.email ?? null,
          province: values.province,
          district: values.district,
          ward: values.ward,
          address: values.address,
          note: values.note || null,
          website: values.website || null,
          promotion_code: activePromotionCode || null,
          scheduled_date: values.scheduled_date,
          scheduled_slot: values.scheduled_slot,
          items: lines.map((line) => ({
            variant_id: line.variantId,
            quantity: line.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Không thể tạo đơn hàng.');
      return data as { orderId: string };
    },
    onSuccess: (data) => {
      clear();
      setShowConfirm(false);
      router.push(`/orders/${data.orderId}`);
    },
    onError: (error) => {
      setSubmitError(
        error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ.',
      );
    },
  });

  const applyPromotionMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code, order_amount: totalAmount }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        throw new Error(data?.message || 'Không thể áp dụng mã khuyến mãi.');
      }
      return data as {
        code?: string;
        discountAmount?: number;
        message?: string;
      };
    },
  });

  useEffect(() => {
    if (!scheduledDate) return;
    const blockedReason = disabledDateReasons[scheduledDate];
    if (!blockedReason) return;
    form.setValue('scheduled_date', '');
    form.setValue('scheduled_slot', '');
    form.setError('scheduled_date', { type: 'manual', message: blockedReason });
  }, [disabledDateReasons, form, scheduledDate]);

  const validateBeforeConfirm = async () => {
    if (lines.length === 0) {
      setSubmitError('Giỏ hàng đang trống.');
      return false;
    }
    const isValid = await form.trigger();
    if (!isValid) {
      setSubmitError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
      return false;
    }
    const values = form.getValues();
    const blockedReason = disabledDateReasons[values.scheduled_date];
    if (blockedReason) {
      setSubmitError(blockedReason);
      return false;
    }
    setSubmitError('');
    return true;
  };

  const submitOrder = () => {
    if (!confirmValues) return;
    setSubmitError('');
    createOrderMutation.mutate(confirmValues);
  };

  const applyPromotionCode = async () => {
    const setPromotionFeedback = (
      message: string,
      tone: PromotionMessageTone = 'neutral',
    ) => {
      setPromotionMessage(message);
      setPromotionMessageTone(tone);
    };
    const nextCode = promotionCode.trim().toUpperCase();
    if (!nextCode) {
      setPromotionFeedback('Vui lòng nhập mã khuyến mãi.', 'error');
      setAppliedPromotionCode('');
      setDiscountAmount(0);
      return;
    }
    if (totalAmount <= 0) {
      setPromotionFeedback('Giỏ hàng đang trống.', 'error');
      return;
    }
    if (!hasMainDish) {
      setPromotionFeedback(
        'Cần có món chính trong giỏ hàng để áp dụng mã khuyến mãi.',
        'error',
      );
      return;
    }
    setPromotionFeedback('');
    try {
      const data = await applyPromotionMutation.mutateAsync(nextCode);
      setPromotionCode(nextCode);
      setAppliedPromotionCode(data.code ?? nextCode);
      setDiscountAmount(Number(data.discountAmount) || 0);
      setPromotionBaseAmount(totalAmount);
      setPromotionBaseLineCount(lines.length);
      setPromotionFeedback(
        data?.message || 'Áp dụng mã khuyến mãi thành công.',
        'success',
      );
    } catch {
      setAppliedPromotionCode('');
      setDiscountAmount(0);
      setPromotionFeedback('Không thể kết nối tới máy chủ.', 'error');
    }
  };

  return (
    <>
      <Header />
      <main className="container-shell py-8">
        <h1 className="text-3xl font-semibold">Giỏ hàng và đặt món</h1>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr,1fr]">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Giỏ hàng</h2>
            <Cart />
          </section>
          <section className="card-surface p-4">
            <h2 className="mb-4 text-xl font-semibold">Thông tin đặt hàng</h2>
            <OrderForm
              form={form}
              dateOptions={dateOptions}
              slotOptions={SCHEDULED_SLOT_OPTIONS}
              disabledDateReasons={disabledDateReasons}
              submitting={createOrderMutation.isPending}
            />
            {submitError ? (
              <p className="mt-3 text-sm text-destructive">{submitError}</p>
            ) : null}
            <div className="mt-4 rounded-xl border border-border p-3">
              <p className="text-sm font-medium">Mã khuyến mãi</p>
              <div className="mt-2 flex gap-2">
                <Input
                  value={promotionCode}
                  onChange={(event) => setPromotionCode(event.target.value)}
                  placeholder="Nhập mã (VD: ANHHAI20)"
                  className="uppercase"
                  disabled={!hasMainDish}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyPromotionCode}
                  disabled={applyPromotionMutation.isPending || !hasMainDish}
                >
                  {applyPromotionMutation.isPending ? 'Đang kiểm tra...' : 'Áp dụng'}
                </Button>
              </div>
              {!hasMainDish ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Cần có món chính trong giỏ hàng để sử dụng mã khuyến mãi.
                </p>
              ) : null}
              {promotionMessage ? (
                <p
                  className={`mt-2 text-xs ${
                    promotionMessageTone === 'error'
                      ? 'text-destructive'
                      : promotionMessageTone === 'success'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                  }`}
                >
                  {promotionMessage}
                </p>
              ) : null}
              {activeDiscountAmount > 0 ? (
                <p className="mt-1 text-sm text-primary">
                  Giảm giá{activePromotionCode ? ` (${activePromotionCode})` : ''}: -{' '}
                  {formatCurrency(activeDiscountAmount)}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              className="mt-4 w-full"
              onClick={async () => {
                if (await validateBeforeConfirm()) {
                  setConfirmValues(form.getValues());
                  setShowConfirm(true);
                }
              }}
            >
              Xác nhận đặt món
            </Button>
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
      <OrderConfirmModal
        open={showConfirm}
        form={confirmValues ?? form.getValues()}
        lines={lines}
        totalAmount={totalAmount}
        discountAmount={activeDiscountAmount}
        promotionCode={activePromotionCode}
        scheduledDateLabel={
          dateOptions.find((entry) => entry.value === (confirmValues?.scheduled_date ?? ''))
            ?.label
        }
        scheduledSlotLabel={
          SCHEDULED_SLOT_OPTIONS.find(
            (entry) => entry.value === (confirmValues?.scheduled_slot ?? ''),
          )?.label
        }
        submitting={createOrderMutation.isPending}
        onCancel={() => setShowConfirm(false)}
        onConfirm={submitOrder}
      />
    </>
  );
}
