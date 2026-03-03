'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Cart } from '@/components/Cart';
import { OrderForm, type OrderFormModel } from '@/components/OrderForm';
import { OrderConfirmModal } from '@/components/OrderConfirmModal';
import { BottomNav } from '@/components/BottomNav';
import { useCartStore, selectCartTotal } from '@/lib/stores/cart';
import { sessionStore } from '@/lib/stores/session';
import { Button } from '@/components/ui/button';

const SLOT_OPTIONS = [
  { value: '10:00-12:00', label: '10:00 - 12:00' },
  { value: '12:00-14:00', label: '12:00 - 14:00' },
  { value: '14:00-16:00', label: '14:00 - 16:00' },
  { value: '16:00-18:00', label: '16:00 - 18:00' },
  { value: '18:00-20:00', label: '18:00 - 20:00' },
];

function nextSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const value = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
    return { value, label };
  });
}

const EMPTY_FORM: OrderFormModel = {
  customerName: '',
  phone: '',
  website: '',
  province: 'Thành phố Hồ Chí Minh',
  district: '',
  ward: '',
  address: '',
  note: '',
  scheduledDate: '',
  scheduledSlot: '',
};

type MenuRuleItem = {
  id: string;
  name: string;
  category_id?: string;
  is_main_dish?: boolean;
  block_today?: boolean;
  block_today_reason?: string | null;
  blocked_delivery_dates?: string[] | null;
  blocked_delivery_date_reasons?: Record<string, string> | null;
};

type CategoryRuleItem = {
  id: string;
  slug?: string;
};

export default function CartPage() {
  const router = useRouter();
  const lines = useCartStore((state) => state.lines);
  const clear = useCartStore((state) => state.clear);
  const totalAmount = useCartStore(selectCartTotal);
  const [form, setForm] = useState<OrderFormModel>(EMPTY_FORM);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [disabledDateReasons, setDisabledDateReasons] = useState<
    Record<string, string>
  >({});
  const dateOptions = useMemo(() => nextSevenDays(), []);
  const todayDateValue = dateOptions[0]?.value ?? '';

  useEffect(() => {
    let active = true;
    async function loadDisabledDates() {
      if (lines.length === 0) {
        if (active) setDisabledDateReasons({});
        return;
      }
      try {
        const response = await fetch('/api/menu', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) return;
        const menuItems = (data?.menuItems ?? []) as MenuRuleItem[];
        const categories = (data?.categories ?? []) as CategoryRuleItem[];
        const menuItemById = new Map(menuItems.map((item) => [item.id, item]));
        const categoryById = new Map(
          categories.map((category) => [category.id, category.slug ?? '']),
        );
        const selectedDates = new Set(dateOptions.map((option) => option.value));
        const reasonsByDate = new Map<string, Set<string>>();

        for (const line of lines) {
          const menuItem = menuItemById.get(line.itemId);
          if (!menuItem) continue;
          const isMainDishItem =
            menuItem.is_main_dish === true ||
            categoryById.get(menuItem.category_id ?? '') === 'lau';
          if (!isMainDishItem) continue;
          const itemLabel = menuItem.name;
          const todayReason =
            menuItem.block_today_reason?.trim() ||
            `Món "${itemLabel}" đang tạm ngưng giao hôm nay.`;
          if (menuItem.block_today && todayDateValue) {
            const reasons = reasonsByDate.get(todayDateValue) ?? new Set<string>();
            reasons.add(todayReason);
            reasonsByDate.set(todayDateValue, reasons);
          }
          for (const blockedDate of menuItem.blocked_delivery_dates ?? []) {
            if (!selectedDates.has(blockedDate)) continue;
            const reasonForDate = menuItem.blocked_delivery_date_reasons?.[
              blockedDate
            ]?.trim();
            const reasons = reasonsByDate.get(blockedDate) ?? new Set<string>();
            reasons.add(
              reasonForDate || `Món "${itemLabel}" không giao trong ngày này.`,
            );
            reasonsByDate.set(blockedDate, reasons);
          }
        }

        const nextReasons: Record<string, string> = {};
        for (const [dateValue, reasons] of reasonsByDate.entries()) {
          nextReasons[dateValue] = Array.from(reasons).join(' ');
        }
        if (active) setDisabledDateReasons(nextReasons);
      } catch {
        if (active) setDisabledDateReasons({});
      }
    }
    loadDisabledDates();
    return () => {
      active = false;
    };
  }, [dateOptions, lines, todayDateValue]);

  useEffect(() => {
    if (!form.scheduledDate) return;
    const blockedReason = disabledDateReasons[form.scheduledDate];
    if (!blockedReason) return;
    setForm((current) => ({ ...current, scheduledDate: '', scheduledSlot: '' }));
    setSubmitError(blockedReason);
  }, [disabledDateReasons, form.scheduledDate]);

  const validateBeforeConfirm = () => {
    const required: Array<keyof OrderFormModel> = [
      'customerName',
      'phone',
      'province',
      'district',
      'ward',
      'address',
      'scheduledDate',
      'scheduledSlot',
    ];
    const failed = required.filter((field) => !form[field]?.trim());
    setInvalidFields(failed as string[]);
    if (lines.length === 0) {
      setSubmitError('Giỏ hàng đang trống.');
      return false;
    }
    if (failed.length > 0) {
      setSubmitError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
      return false;
    }
    const blockedReason = disabledDateReasons[form.scheduledDate];
    if (blockedReason) {
      setSubmitError(blockedReason);
      return false;
    }
    setSubmitError('');
    return true;
  };

  const submitOrder = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const sessionId = sessionStore.getCurrent();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          customerName: form.customerName,
          phone: form.phone,
          province: form.province,
          district: form.district,
          ward: form.ward,
          address: form.address,
          note: form.note || null,
          website: form.website || null,
          scheduledDate: form.scheduledDate,
          scheduledSlot: form.scheduledSlot,
          items: lines.map((line) => ({
            variantId: line.variantId,
            quantity: line.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data?.message || 'Không thể tạo đơn hàng.');
        return;
      }
      clear();
      setShowConfirm(false);
      router.push(`/orders/${data.orderId}`);
    } catch {
      setSubmitError('Không thể kết nối tới máy chủ.');
    } finally {
      setSubmitting(false);
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
              model={form}
              onChange={setForm}
              dateOptions={dateOptions}
              slotOptions={SLOT_OPTIONS}
              disabledDateReasons={disabledDateReasons}
              submitting={submitting}
              invalidFields={invalidFields}
            />
            {submitError ? (
              <p className="mt-3 text-sm text-destructive">{submitError}</p>
            ) : null}
            <Button
              type="button"
              className="mt-4 w-full"
              onClick={() => {
                if (validateBeforeConfirm()) setShowConfirm(true);
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
        form={form}
        lines={lines}
        totalAmount={totalAmount}
        scheduledDateLabel={
          dateOptions.find((entry) => entry.value === form.scheduledDate)?.label
        }
        scheduledSlotLabel={
          SLOT_OPTIONS.find((entry) => entry.value === form.scheduledSlot)
            ?.label
        }
        submitting={submitting}
        onCancel={() => setShowConfirm(false)}
        onConfirm={submitOrder}
      />
    </>
  );
}
