'use client';

import { useMemo, useState } from 'react';
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
  const dateOptions = useMemo(() => nextSevenDays(), []);

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
