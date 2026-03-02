'use client';

import { useMemo, useState } from 'react';
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

export type OrderFormModel = {
  customerName: string;
  phone: string;
  website: string;
  province: string;
  district: string;
  ward: string;
  address: string;
  note: string;
  scheduledDate: string;
  scheduledSlot: string;
};

type Props = {
  model: OrderFormModel;
  onChange: (value: OrderFormModel) => void;
  dateOptions: { value: string; label: string }[];
  slotOptions: { value: string; label: string }[];
  submitting?: boolean;
  invalidFields?: string[];
};

const baseInputClass =
  'w-full rounded-xl border bg-background px-3 py-2 text-sm';

export function OrderForm({
  model,
  onChange,
  dateOptions,
  slotOptions,
  submitting = false,
  invalidFields = [],
}: Props) {
  const [addressMode, setAddressMode] = useState<AddressMode>('old');
  const [selectedProvinceCode, setSelectedProvinceCode] =
    useState(HCMC_PROVINCE_CODE);

  const provinces = addressMode === 'old' ? PROVINCES_OLD : PROVINCES_NEW;
  const districts =
    addressMode === 'old' ? HCM_DISTRICTS_OLD : HCM_DISTRICTS_NEW;
  const wardMap = addressMode === 'old' ? HCM_WARDS_OLD : HCM_WARDS_NEW;
  const isHcmProvince = selectedProvinceCode === HCMC_PROVINCE_CODE;
  const wards = wardMap[model.district] ?? [];

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

  const isInvalid = (field: string) => invalidFields.includes(field);
  const inputClass = (field: string) =>
    `${baseInputClass} ${isInvalid(field) ? 'border-destructive' : 'border-input'}`;

  const setField = <K extends keyof OrderFormModel>(
    key: K,
    value: OrderFormModel[K],
  ) => {
    onChange({ ...model, [key]: value });
  };

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
              value={model.scheduledDate || 'none'}
              onValueChange={(value) =>
                setField('scheduledDate', value === 'none' ? '' : value)
              }
            >
              <SelectTrigger className={inputClass('scheduledDate')}>
                <SelectValue placeholder="Chọn ngày nhận món" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Chọn ngày nhận món</SelectItem>
                {dateOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm">
            <Label className="mb-1 block">Khung giờ nhận món *</Label>
            <Select
              value={model.scheduledSlot || 'none'}
              onValueChange={(value) =>
                setField('scheduledSlot', value === 'none' ? '' : value)
              }
            >
              <SelectTrigger className={inputClass('scheduledSlot')}>
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
              className={inputClass('customerName')}
              value={model.customerName}
              onChange={(event) => setField('customerName', event.target.value)}
            />
          </div>
          <div className="text-sm">
            <Label className="mb-1 block">SĐT *</Label>
            <PhoneInput
              value={model.phone}
              onChange={(value) => setField('phone', value)}
              invalid={isInvalid('phone')}
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
              onChange({
                ...model,
                province: HCMC_PROVINCE_NAME,
                district: '',
                ward: '',
              });
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
              onChange({
                ...model,
                province: HCMC_PROVINCE_NAME,
                district: '',
                ward: '',
              });
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
                onChange({
                  ...model,
                  province: provinceName,
                  district: '',
                  ward: '',
                });
              }}
              placeholder="Chọn Thành phố/Tỉnh"
              className={inputClass('province')}
            />
          </div>
          <div className="text-sm">
            <Label className="mb-1 block">Quận/Huyện *</Label>
            <SelectSearch
              value={model.district}
              options={districtOptions}
              onChange={(district) =>
                onChange({ ...model, district, ward: '' })
              }
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
              value={model.ward}
              options={wardOptions}
              onChange={(ward) => setField('ward', ward)}
              placeholder="Chọn Phường"
              disabled={!isHcmProvince || !model.district}
              className={inputClass('ward')}
            />
          </div>
          <div className="text-sm">
            <Label className="mb-1 block">Số nhà, tên đường *</Label>
            <Input
              className={inputClass('address')}
              value={model.address}
              onChange={(event) => setField('address', event.target.value)}
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
            value={model.note}
            onChange={(event) => setField('note', event.target.value)}
          />
        </div>
        <div
          className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden"
          aria-hidden="true"
        >
          <div>
            Website
            <Input
              value={model.website}
              onChange={(event) => setField('website', event.target.value)}
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
