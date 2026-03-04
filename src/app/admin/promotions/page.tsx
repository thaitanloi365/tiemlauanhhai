'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { parseAsString, useQueryStates } from 'nuqs';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils/format';
import {
  PROMOTION_TYPE_OPTIONS,
  PROMOTION_TYPE_UI,
  type PromotionTypeValue,
} from '@/lib/constants/promotion';
import { formatDateTimeVi } from '@/lib/date';

type AdminPromotion = AppTypes.Promotion;

const promotion_form_schema = z.object({
  code: z.string().trim().min(3, 'Mã khuyến mãi cần ít nhất 3 ký tự'),
  type: z.enum(['fixed_amount', 'percentage']),
  discount_value: z.string().trim().min(1, 'Vui lòng nhập giá trị giảm'),
  max_discount_amount: z.string().trim(),
  min_order_amount: z.string().trim().min(1, 'Vui lòng nhập đơn tối thiểu'),
  max_usage: z.string().trim(),
  valid_from: z.string().trim().min(1, 'Vui lòng chọn thời gian bắt đầu'),
  valid_until: z.string().trim().min(1, 'Vui lòng chọn thời gian kết thúc'),
  is_active: z.boolean(),
});

type PromotionFormValues = z.infer<typeof promotion_form_schema>;

const EMPTY_FORM: PromotionFormValues = {
  code: '',
  type: 'fixed_amount',
  discount_value: '',
  max_discount_amount: '',
  min_order_amount: '0',
  max_usage: '',
  valid_from: '',
  valid_until: '',
  is_active: true,
};

function toDateTimeLocalValue(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

export default function AdminPromotionsPage() {
  const queryClient = useQueryClient();
  const [f, setF] = useQueryStates({
    q: parseAsString.withDefault(''),
    t: parseAsString.withDefault(''),
  });
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const {
    register,
    control,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PromotionFormValues>({
    resolver: zodResolver(promotion_form_schema),
    defaultValues: EMPTY_FORM,
  });
  const codeValue = useWatch({ control, name: 'code' }) ?? '';
  const typeValue = useWatch({ control, name: 'type' }) ?? 'fixed_amount';

  const promotionsQuery = useQuery({
    queryKey: ['admin', 'promotions', f.q, f.t],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (f.q.trim()) params.set('q', f.q.trim());
      if (f.t) params.set('type', f.t);
      const query = params.toString();
      const res = await fetch(`/api/admin/promotions${query ? `?${query}` : ''}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? 'Không thể tải danh sách mã khuyến mãi.');
      }
      return (data.promotions ?? []) as AdminPromotion[];
    },
  });

  const editingPromotion = useMemo(
    () => promotionsQuery.data?.find((item) => item.id === editingId) ?? null,
    [editingId, promotionsQuery.data],
  );

  const createPromotionMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Không thể tạo mã khuyến mãi.');
      return data;
    },
    onSuccess: async () => {
      setMessage('');
      reset(EMPTY_FORM);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ.');
    },
  });

  const updatePromotionMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Không thể cập nhật mã khuyến mãi.');
      return data;
    },
    onSuccess: async () => {
      setMessage('');
      setEditingId(null);
      reset(EMPTY_FORM);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ.');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (promotion: AdminPromotion) => {
      const res = await fetch(`/api/admin/promotions/${promotion.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ is_active: !promotion.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Không thể cập nhật trạng thái.');
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ.');
    },
  });

  const deletePromotionMutation = useMutation({
    mutationFn: async (promotionId: string) => {
      const res = await fetch(`/api/admin/promotions/${promotionId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Không thể xóa mã khuyến mãi.');
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ.');
    },
  });

  const startEdit = (promotion: AdminPromotion) => {
    setEditingId(promotion.id);
    reset({
      code: promotion.code,
      type: promotion.type,
      discount_value: String(promotion.discount_value),
      max_discount_amount: promotion.max_discount_amount
        ? String(promotion.max_discount_amount)
        : '',
      min_order_amount: String(promotion.min_order_amount),
      max_usage: promotion.max_usage ? String(promotion.max_usage) : '',
      valid_from: toDateTimeLocalValue(promotion.valid_from),
      valid_until: toDateTimeLocalValue(promotion.valid_until),
      is_active: promotion.is_active,
    });
  };

  const submitForm = handleSubmit(async (formValues) => {
    setMessage('');
    const payload = {
      code: formValues.code.trim().toUpperCase(),
      type: formValues.type,
      discount_value: Number(formValues.discount_value),
      max_discount_amount:
        formValues.type === 'percentage' && formValues.max_discount_amount.trim()
          ? Number(formValues.max_discount_amount)
          : null,
      min_order_amount: Number(formValues.min_order_amount || 0),
      max_usage: formValues.max_usage.trim() ? Number(formValues.max_usage) : null,
      valid_from: toIsoDateTime(formValues.valid_from),
      valid_until: toIsoDateTime(formValues.valid_until),
      is_active: formValues.is_active,
    };

    if (editingId) {
      await updatePromotionMutation.mutateAsync({ id: editingId, payload });
      return;
    }
    await createPromotionMutation.mutateAsync(payload);
  });

  const promotions = promotionsQuery.data ?? [];
  const isMutating =
    createPromotionMutation.isPending ||
    updatePromotionMutation.isPending ||
    toggleActiveMutation.isPending ||
    deletePromotionMutation.isPending;

  return (
    <div className="container-shell space-y-4">
      <h1 className="text-3xl font-bold">Quản lý mã khuyến mãi</h1>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">
          {editingId ? `Cập nhật mã ${editingPromotion?.code ?? ''}` : 'Tạo mã mới'}
        </h2>
        <form
          className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3"
          onSubmit={submitForm}
          noValidate
        >
          <Input
            placeholder="Mã code"
            {...register('code')}
            value={codeValue}
            disabled={Boolean(editingId)}
            onChange={(event) => {
              setValue('code', event.target.value.toUpperCase(), {
                shouldDirty: true,
              });
            }}
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            {...register('type')}
            disabled={Boolean(editingId)}
          >
            {PROMOTION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min={1}
            placeholder={typeValue === 'percentage' ? 'Phần trăm giảm (%)' : 'Số tiền giảm'}
            {...register('discount_value')}
          />
          {typeValue === 'percentage' ? (
            <Input
              type="number"
              min={0}
              placeholder="Giảm tối đa (đ)"
              {...register('max_discount_amount')}
            />
          ) : null}
          <Input
            type="number"
            min={0}
            placeholder="Đơn tối thiểu (đ)"
            {...register('min_order_amount')}
          />
          <Input
            type="number"
            min={1}
            placeholder="Giới hạn lượt dùng"
            {...register('max_usage')}
          />
          <Input
            type="datetime-local"
            {...register('valid_from')}
          />
          <Input
            type="datetime-local"
            {...register('valid_until')}
          />
          <label className="flex items-center gap-2 rounded-md border border-input px-3 text-sm">
            <input
              type="checkbox"
              {...register('is_active')}
            />
            Đang hoạt động
          </label>
          {Object.keys(errors).length > 0 ? (
            <p className="text-sm text-destructive">Vui lòng kiểm tra lại dữ liệu nhập.</p>
          ) : null}
          <div className="mt-3 flex gap-2 md:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={isSubmitting || isMutating}>
              {isSubmitting
              ? 'Đang lưu...'
              : editingId
                ? 'Lưu thay đổi'
                : 'Tạo mã khuyến mãi'}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  reset(EMPTY_FORM);
                }}
              >
                Hủy chỉnh sửa
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={f.q}
            onChange={(event) => setF({ q: event.target.value })}
            placeholder="Tìm theo mã khuyến mãi..."
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={f.t || 'all'}
            onChange={(event) =>
              setF({
                t: event.target.value === 'all' ? '' : event.target.value,
              })
            }
          >
            <option value="all">Tất cả loại</option>
            {PROMOTION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {message ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
          {message}
        </div>
      ) : null}

      {promotionsQuery.isPending ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      ) : promotionsQuery.isError ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
          {promotionsQuery.error.message}
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          Chưa có mã khuyến mãi nào.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Mã</th>
                <th className="px-3 py-2 font-medium">Loại</th>
                <th className="px-3 py-2 font-medium">Giảm giá</th>
                <th className="px-3 py-2 font-medium">Đơn tối thiểu</th>
                <th className="px-3 py-2 font-medium">Lượt dùng</th>
                <th className="px-3 py-2 font-medium">Hiệu lực</th>
                <th className="px-3 py-2 font-medium">Trạng thái</th>
                <th className="px-3 py-2 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promotion) => (
                <tr key={promotion.id} className="border-b align-top last:border-0">
                  <td className="px-3 py-2 font-semibold">{promotion.code}</td>
                  <td className="px-3 py-2">{PROMOTION_TYPE_UI[promotion.type].label}</td>
                  <td className="px-3 py-2">
                    {promotion.type === 'fixed_amount'
                      ? formatCurrency(promotion.discount_value)
                      : `${promotion.discount_value}% (tối đa ${formatCurrency(
                          promotion.max_discount_amount ?? 0,
                        )})`}
                  </td>
                  <td className="px-3 py-2">{formatCurrency(promotion.min_order_amount)}</td>
                  <td className="px-3 py-2">
                    {promotion.used_count}/
                    {promotion.max_usage === null ? 'Không giới hạn' : promotion.max_usage}
                  </td>
                  <td className="px-3 py-2">
                    {formatDateTimeVi(promotion.valid_from)}
                    <br />
                    {formatDateTimeVi(promotion.valid_until)}
                  </td>
                  <td className="px-3 py-2">
                    {promotion.is_active ? 'Hoạt động' : 'Đã khóa'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => startEdit(promotion)}>
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActiveMutation.mutate(promotion)}
                        disabled={isMutating}
                      >
                        {promotion.is_active ? 'Khóa' : 'Mở'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePromotionMutation.mutate(promotion.id)}
                        disabled={isMutating}
                      >
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
