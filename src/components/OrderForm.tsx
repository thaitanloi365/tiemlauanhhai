'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { HCM_DISTRICTS_NEW } from '@/lib/data/hcm-districts-new';
import { HCM_DISTRICTS_OLD } from '@/lib/data/hcm-districts-old';
import { HCM_WARDS_NEW } from '@/lib/data/hcm-wards-new';
import { HCM_WARDS_OLD } from '@/lib/data/hcm-wards-old';
import { PROVINCES_NEW } from '@/lib/data/provinces-new';
import {
  HCMC_PROVINCE_CODE,
  HCMC_PROVINCE_NAME,
  PROVINCES_OLD,
} from '@/lib/data/provinces-old';
import { PhoneInput } from '@/components/PhoneInput';
import { SelectSearch } from '@/components/SelectSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type AddressMode = 'old' | 'new';

export const order_form_schema = z.object({
  customer_name: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự').max(120),
  phone: z.string().trim().min(1, 'Vui lòng nhập số điện thoại'),
  email: z.string().trim().email('Email không hợp lệ').nullable().optional(),
  website: z.string().trim().max(200),
  province: z.string().trim().min(1, 'Vui lòng chọn Tỉnh/Thành'),
  district: z.string().trim().min(1, 'Vui lòng chọn Quận/Huyện'),
  ward: z.string().trim().min(1, 'Vui lòng chọn Phường/Xã'),
  address: z.string().trim().min(5, 'Vui lòng nhập địa chỉ chi tiết'),
  note: z.string(),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày nhận món không hợp lệ'),
  scheduled_slot: z.string().trim().min(1, 'Vui lòng chọn khung giờ'),
});

export type OrderFormValues = z.infer<typeof order_form_schema>;

export const ORDER_FORM_DEFAULT_VALUES: OrderFormValues = {
  customer_name: '',
  phone: '',
  email: null,
  website: '',
  province: HCMC_PROVINCE_NAME,
  district: '',
  ward: '',
  address: '',
  note: '',
  scheduled_date: '',
  scheduled_slot: '',
};

export function useOrderForm() {
  return useForm<OrderFormValues>({
    resolver: zodResolver(order_form_schema),
    defaultValues: ORDER_FORM_DEFAULT_VALUES,
  });
}

type Props = {
  form: UseFormReturn<OrderFormValues>;
  dateOptions: { value: string; label: string }[];
  slotOptions: { value: string; label: string }[];
  disabledDateReasons?: Record<string, string>;
  submitting?: boolean;
};

const baseInputClass =
  'w-full rounded-xl border bg-background px-3 py-2 text-sm';

export function OrderForm({
  form,
  dateOptions,
  slotOptions,
  disabledDateReasons = {},
  submitting = false,
}: Props) {
  const { register, control, watch, setValue, formState } = form;
  const values = watch();
  const [addressMode, setAddressMode] = useState<AddressMode>('old');
  const [selectedProvinceCode, setSelectedProvinceCode] =
    useState(HCMC_PROVINCE_CODE);

  const provinces = addressMode === 'old' ? PROVINCES_OLD : PROVINCES_NEW;
  const districts =
    addressMode === 'old' ? HCM_DISTRICTS_OLD : HCM_DISTRICTS_NEW;
  const wardMap = addressMode === 'old' ? HCM_WARDS_OLD : HCM_WARDS_NEW;
  const isHcmProvince = selectedProvinceCode === HCMC_PROVINCE_CODE;
  const wards = useMemo(
    () => wardMap[values.district] ?? [],
    [values.district, wardMap],
  );

  const provinceOptions = useMemo(
    () =>
      provinces.map((entry) => ({
        value: entry.code,
        label: entry.name,
        keywords: [entry.code],
      })),
    [provinces],
  );

  const districtOptions = useMemo(
    () => [
      { value: '', label: 'Chọn Quận/Huyện' },
      ...districts.map((entry) => ({ value: entry.name, label: entry.name })),
    ],
    [districts],
  );

  const wardOptions = useMemo(
    () => [
      { value: '', label: 'Chọn Phường' },
      ...wards.map((entry) => ({ value: entry, label: entry })),
    ],
    [wards],
  );

  const isInvalid = (field: keyof OrderFormValues) =>
    Boolean(formState.errors[field]);
  const inputClass = (field: keyof OrderFormValues) =>
    `${baseInputClass} ${isInvalid(field) ? 'border-destructive' : 'border-input'}`;
  const blockedDateEntries = Object.entries(disabledDateReasons);
  const blockedDateDetails = dateOptions
    .filter((option) => disabledDateReasons[option.value])
    .map((option) => ({
      label: option.label,
      reason: disabledDateReasons[option.value],
    }));

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <p className="text-sm font-semibold text-foreground">
          Thời gian nhận món
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="text-sm">
            <Label className="mb-1 block">Ngày nhận món *</Label>
            <Select
              value={values.scheduled_date || 'none'}
              onValueChange={(value) =>
                setValue('scheduled_date', value === 'none' ? '' : value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className={inputClass('scheduled_date')}>
                <SelectValue placeholder="Chọn ngày nhận món" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Chọn ngày nhận món</SelectItem>
                {dateOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={Boolean(disabledDateReasons[option.value])}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {blockedDateEntries.length > 0 ? (
              <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                <p className="font-medium">Ngày giao đang bị chặn:</p>
                <ul className="mt-1 space-y-1">
                  {blockedDateDetails.map((entry) => (
                    <li key={entry.label}>
                      {entry.label}: {entry.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="text-sm">
            <Label className="mb-1 block">Khung giờ nhận món *</Label>
            <Select
              value={values.scheduled_slot || 'none'}
              onValueChange={(value) =>
                setValue('scheduled_slot', value === 'none' ? '' : value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className={inputClass('scheduled_slot')}>
                <SelectValue placeholder="Chọn khung giờ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Chọn khung giờ</SelectItem>
                {slotOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-semibold text-foreground">
          Thông tin người nhận
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="text-sm">
            <Label className="mb-1 block">Họ tên *</Label>
            <Input
              className={inputClass('customer_name')}
              {...register('customer_name')}
            />
          </div>
          <div className="text-sm">
            <Label className="mb-1 block">SĐT *</Label>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <PhoneInput
                  value={field.value}
                  onChange={field.onChange}
                  invalid={isInvalid('phone')}
                />
              )}
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="text-sm">
            <Label className="mb-1 block">Email</Label>
            <Input
              type="email"
              className={inputClass('email')}
              value={values.email ?? ''}
              onChange={(event) =>
                setValue('email', event.target.value.trim() || null, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-semibold text-foreground">
          Thông tin địa chỉ
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant={addressMode === 'old' ? 'secondary' : 'outline'}
            onClick={() => {
              setAddressMode('old');
              setSelectedProvinceCode(HCMC_PROVINCE_CODE);
              setValue('province', HCMC_PROVINCE_NAME);
              setValue('district', '');
              setValue('ward', '');
            }}
          >
            Địa chỉ cũ
          </Button>
          <Button
            type="button"
            variant={addressMode === 'new' ? 'secondary' : 'outline'}
            onClick={() => {
              setAddressMode('new');
              setSelectedProvinceCode(HCMC_PROVINCE_CODE);
              setValue('province', HCMC_PROVINCE_NAME);
              setValue('district', '');
              setValue('ward', '');
            }}
          >
            Địa chỉ mới
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="text-sm">
            <Label className="mb-1 block">Thành phố/Tỉnh</Label>
            <SelectSearch
              value={selectedProvinceCode}
              options={provinceOptions}
              onChange={(code) => {
                setSelectedProvinceCode(code);
                const provinceName =
                  provinces.find((entry) => entry.code === code)?.name || '';
                setValue('province', provinceName);
                setValue('district', '');
                setValue('ward', '');
              }}
              placeholder="Chọn Thành phố/Tỉnh"
              className={inputClass('province')}
            />
          </div>
          <div className="text-sm">
            <Label className="mb-1 block">Quận/Huyện *</Label>
            <SelectSearch
              value={values.district}
              options={districtOptions}
              onChange={(district) => {
                setValue('district', district, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue('ward', '', { shouldDirty: true, shouldValidate: true });
              }}
              placeholder="Chọn Quận/Huyện"
              disabled={!isHcmProvince}
              className={inputClass('district')}
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="text-sm">
            <Label className="mb-1 block">Phường *</Label>
            <SelectSearch
              value={values.ward}
              options={wardOptions}
              onChange={(ward) =>
                setValue('ward', ward, { shouldDirty: true, shouldValidate: true })
              }
              placeholder="Chọn Phường"
              disabled={!isHcmProvince || !values.district}
              className={inputClass('ward')}
            />
          </div>
          <div className="text-sm">
            <Label className="mb-1 block">Số nhà, tên đường *</Label>
            <Input
              className={inputClass('address')}
              {...register('address')}
            />
          </div>
        </div>
        {!isHcmProvince ? (
          <div className="rounded-xl border border-border bg-muted p-3 text-sm text-foreground">
            Hiện tại quán chỉ hỗ trợ giao khu vực Thành phố Hồ Chí Minh.
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <div className="text-sm">
          <Label className="mb-1 block">Ghi chú</Label>
          <Textarea
            className={`${baseInputClass} border-input h-24`}
            {...register('note')}
          />
        </div>
        <div
          className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden"
          aria-hidden="true"
        >
          <div>
            Website
            <Input
              {...register('website')}
              autoComplete="off"
              tabIndex={-1}
            />
          </div>
        </div>
      </section>

      {submitting ? (
        <p className="text-sm text-muted-foreground">Đang gửi đơn hàng...</p>
      ) : null}
    </div>
  );
}
