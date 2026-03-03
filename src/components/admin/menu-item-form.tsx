'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, isValid, parse } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type CategoryOption = { id: string; name: string };
type MediaEntry = {
  type: 'image' | 'video';
  url: string;
  altText?: string | null;
};
type BlockedDateRule = {
  date: string;
  reason: string;
};
type MenuVariant = {
  id?: string;
  name: string;
  price: number;
  serves_min?: number | null;
  serves_max?: number | null;
  is_default?: boolean;
};
type MenuItemInput = {
  id?: string;
  name: string;
  category_id: string;
  description?: string | null;
  ingredients?: string | null;
  note?: string | null;
  preparation_time_minutes?: number | null;
  thumbnail_url?: string | null;
  is_topping?: boolean;
  is_main_dish?: boolean;
  block_today?: boolean;
  block_today_reason?: string | null;
  blocked_delivery_dates?: string[] | null;
  blocked_delivery_date_reasons?: Record<string, string> | null;
  sort_order?: number;
  variants?: MenuVariant[];
  media?: { type: 'image' | 'video'; url: string; alt_text?: string | null }[];
};

type Props = {
  open: boolean;
  categories: CategoryOption[];
  item?: MenuItemInput | null;
  onClose: () => void;
  onSaved?: (savedItem?: unknown) => void;
};

const EMPTY_VARIANT = { name: '', price: '' };
const DEFAULT_MENU_IMAGE = '/logo.png';

function toBlockedDateRules(
  dates: string[] | null | undefined,
  reasonMap: Record<string, string> | null | undefined,
): BlockedDateRule[] {
  const uniqueDates = Array.from(
    new Set((dates ?? []).filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry))),
  );
  return uniqueDates.map((date) => ({
    date,
    reason: reasonMap?.[date]?.trim() ?? '',
  }));
}

function parseBlockedDate(value: string) {
  const parsed = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : undefined;
}

const variantFormSchema = z.object({
  name: z.string().trim().min(1, 'Tên biến thể không được để trống.'),
  price: z
    .string()
    .min(1, 'Giá biến thể không hợp lệ.')
    .refine((value) => {
      const parsed = parseCurrencyInput(value);
      return parsed !== null && parsed >= 0;
    }, 'Giá biến thể không hợp lệ.'),
});

const mediaFormSchema = z.object({
  type: z.enum(['image', 'video']),
  url: z.string().trim().min(1),
  altText: z.string().optional().nullable(),
});
const blockedDateRuleSchema = z.object({
  date: z
    .string()
    .trim()
    .refine((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry), 'Ngày phải có dạng YYYY-MM-DD.'),
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do chặn ngày này.'),
});

const menuItemFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên món và chọn danh mục.'),
  categoryId: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên món và chọn danh mục.'),
  description: z.string(),
  ingredients: z.string(),
  note: z.string(),
  preparationTimeMinutes: z
    .string()
    .refine(
      (value) =>
        value.trim() === '' ||
        (Number.isFinite(Number(value)) && Number(value) >= 0),
      'Thời gian chuẩn bị không hợp lệ.',
    ),
  thumbnailUrl: z.string(),
  isTopping: z.boolean(),
  isMainDish: z.boolean(),
  blockToday: z.boolean(),
  blockTodayReason: z.string(),
  blockedDateRules: z.array(blockedDateRuleSchema),
  sortOrder: z
    .string()
    .refine((value) => Number.isFinite(Number(value)), 'Thứ tự hiển thị không hợp lệ.'),
  variants: z.array(variantFormSchema).min(1, 'Cần ít nhất một biến thể.'),
  media: z.array(mediaFormSchema),
});

type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

export function MenuItemForm({
  open,
  categories,
  item,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(item?.id);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      description: '',
      ingredients: '',
      note: '',
      preparationTimeMinutes: '',
      thumbnailUrl: DEFAULT_MENU_IMAGE,
      isTopping: false,
      isMainDish: false,
      blockToday: false,
      blockTodayReason: '',
      blockedDateRules: [],
      sortOrder: '99',
      variants: [{ ...EMPTY_VARIANT }],
      media: [],
    },
  });
  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariantField,
    replace: replaceVariants,
  } = useFieldArray({
    control,
    name: 'variants',
  });
  const {
    fields: mediaFields,
    append: appendMedia,
    remove: removeMedia,
  } = useFieldArray({
    control,
    name: 'media',
  });
  const {
    fields: blockedDateRuleFields,
    append: appendBlockedDateRule,
    remove: removeBlockedDateRule,
  } = useFieldArray({
    control,
    name: 'blockedDateRules',
  });

  useEffect(() => {
    if (!open) return;
    const nextVariants = (item?.variants ?? []).map((entry) => ({
      name: entry.name ?? '',
      price: formatCurrencyInput(String(entry.price ?? '')),
    }));
    reset({
      name: item?.name ?? '',
      categoryId: item?.category_id ?? categories[0]?.id ?? '',
      description: item?.description ?? '',
      ingredients: item?.ingredients ?? '',
      note: item?.note ?? '',
      preparationTimeMinutes:
        typeof item?.preparation_time_minutes === 'number'
          ? String(item.preparation_time_minutes)
          : '',
      thumbnailUrl: item?.thumbnail_url ?? DEFAULT_MENU_IMAGE,
      isTopping: Boolean(item?.is_topping),
      isMainDish: Boolean(item?.is_main_dish),
      blockToday: Boolean(item?.block_today),
      blockTodayReason: item?.block_today_reason ?? '',
      blockedDateRules: toBlockedDateRules(
        item?.blocked_delivery_dates,
        item?.blocked_delivery_date_reasons,
      ),
      sortOrder: String(item?.sort_order ?? 99),
      variants: nextVariants.length > 0 ? nextVariants : [{ ...EMPTY_VARIANT }],
      media: (item?.media ?? []).map((entry) => ({
        type: entry.type,
        url: entry.url,
        altText: entry.alt_text ?? null,
      })),
    });
    setMessage('');
  }, [open, item, categories, reset]);

  function addVariant() {
    appendVariant({ ...EMPTY_VARIANT });
  }

  function removeVariant(index: number) {
    if (variantFields.length <= 1) {
      replaceVariants([{ ...EMPTY_VARIANT }]);
      return;
    }
    removeVariantField(index);
  }

  function addUploadedEntries(entries: MediaEntry[]) {
    appendMedia(
      entries.map((entry) => ({
        type: entry.type,
        url: entry.url,
        altText: entry.altText ?? null,
      })),
    );
    const firstImage = entries.find((entry) => entry.type === 'image');
    const currentThumbnail = getValues('thumbnailUrl');
    if (
      firstImage &&
      (!currentThumbnail || currentThumbnail === DEFAULT_MENU_IMAGE)
    ) {
      setValue('thumbnailUrl', firstImage.url, { shouldDirty: true });
    }
  }

  async function uploadFiles(files: File[], setThumbnailOnly = false) {
    if (files.length === 0) return;
    setUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.message ?? 'Upload thất bại');
        return;
      }
      const uploaded = (payload.files ?? []) as MediaEntry[];
      if (setThumbnailOnly) {
        const firstImage = uploaded.find((entry) => entry.type === 'image');
        if (!firstImage?.url) {
          setMessage('Không tìm thấy ảnh hợp lệ sau khi upload.');
          return;
        }
        setValue('thumbnailUrl', firstImage.url, { shouldDirty: true });
        return;
      }
      addUploadedEntries(uploaded);
    } finally {
      setUploading(false);
    }
  }

  async function submit(values: MenuItemFormValues) {
    setMessage('');
    const normalizedVariants = values.variants.map((entry) => ({
      name: entry.name.trim(),
      price: parseCurrencyInput(entry.price),
    }));
    const blockedDateMap = new Map<string, string>();
    for (const entry of values.blockedDateRules) {
      blockedDateMap.set(entry.date.trim(), entry.reason.trim());
    }
    const blockedDeliveryDates = Array.from(blockedDateMap.keys());
    const blockedDeliveryDateReasons = Object.fromEntries(blockedDateMap.entries());

    const payload = {
      name: values.name.trim(),
      categoryId: values.categoryId,
      description: values.description.trim() || null,
      ingredients: values.ingredients.trim() || null,
      note: values.note.trim() || null,
      preparationTimeMinutes: values.preparationTimeMinutes
        ? Math.max(0, Number(values.preparationTimeMinutes))
        : null,
      thumbnailUrl: values.thumbnailUrl.trim() || null,
      isTopping: values.isTopping,
      isMainDish: values.isMainDish,
      blockToday: values.blockToday,
      blockTodayReason: values.blockTodayReason.trim() || null,
      blockedDeliveryDates,
      blockedDeliveryDateReasons,
      sortOrder: Number(values.sortOrder || 0),
      variants: normalizedVariants.map((entry, index) => ({
        name: entry.name,
        price: Math.round(entry.price ?? 0),
        isDefault: index === 0,
      })),
      media: values.media.map((entry) => ({
        type: entry.type,
        url: entry.url,
        altText: entry.altText ?? null,
      })),
    };

    try {
      const endpoint = isEdit
        ? `/api/admin/menu/${item?.id}`
        : '/api/admin/menu';
      const method = isEdit ? 'PATCH' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.message ?? 'Không lưu được món');
        return;
      }
      onSaved?.(result.item);
      onClose();
    } catch {
      setMessage('Không lưu được món');
    }
  }
  const thumbnailUrl = watch('thumbnailUrl');
  const isMainDish = watch('isMainDish');
  const blockedDateRules = watch('blockedDateRules');
  const missingReasonDates = useMemo(
    () =>
      (blockedDateRules ?? [])
        .map((entry) => ({
          date: entry?.date?.trim() ?? '',
          reason: entry?.reason?.trim() ?? '',
        }))
        .filter((entry) => entry.date && !entry.reason)
        .map((entry) => entry.date),
    [blockedDateRules],
  );
  const hasRealtimeBlockedDateIssue = missingReasonDates.length > 0;

  useEffect(() => {
    if (isMainDish) return;
    setValue('blockToday', false, { shouldDirty: true });
    setValue('blockTodayReason', '', { shouldDirty: true });
    setValue('blockedDateRules', [], { shouldDirty: true });
  }, [isMainDish, setValue]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Chỉnh sửa món' : 'Thêm món mới'}</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin món, biến thể giá và media để hiển thị đúng trên
            menu.
          </DialogDescription>
        </DialogHeader>

        <form
          id="menu-item-form"
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={handleSubmit(submit)}
          noValidate
        >
          <div className="grid gap-1 sm:col-span-2">
            <Label>Tên món</Label>
            <Input {...register('name')} />
            {errors.name?.message ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="grid gap-1">
            <Label>Danh mục</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId?.message ? (
              <p className="text-xs text-destructive">{errors.categoryId.message}</p>
            ) : null}
          </div>
          <div className="grid gap-1">
            <Label>Thứ tự hiển thị</Label>
            <Input type="number" {...register('sortOrder')} />
            {errors.sortOrder?.message ? (
              <p className="text-xs text-destructive">{errors.sortOrder.message}</p>
            ) : null}
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <Label>Mô tả</Label>
            <Textarea className="min-h-20" {...register('description')} />
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <Label>Nguyên liệu</Label>
            <Textarea className="min-h-20" {...register('ingredients')} />
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <Label>Note nhà hàng</Label>
            <Textarea className="min-h-16" {...register('note')} />
          </div>
          <div className="grid gap-1">
            <Label>Thời gian chuẩn bị (phút)</Label>
            <Input type="number" {...register('preparationTimeMinutes')} />
            {errors.preparationTimeMinutes?.message ? (
              <p className="text-xs text-destructive">
                {errors.preparationTimeMinutes.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Thumbnail</Label>
            <div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
              <div className="aspect-video w-36 overflow-hidden rounded-md">
                <img
                  src={thumbnailUrl || DEFAULT_MENU_IMAGE}
                  alt="Thumbnail preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild type="button" variant="outline">
                  <Label className="cursor-pointer">
                    <Input
                      className="hidden"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        uploadFiles(Array.from(e.target.files ?? []), true)
                      }
                    />
                    {uploading ? 'Đang upload...' : 'Upload thumbnail'}
                  </Label>
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    setValue('thumbnailUrl', DEFAULT_MENU_IMAGE, {
                      shouldDirty: true,
                    })
                  }
                  variant="outline"
                >
                  Dùng ảnh mặc định
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="isTopping"
              render={({ field }) => (
                <Checkbox
                  id="menu-item-is-topping"
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value === true)}
                />
              )}
            />
            <Label htmlFor="menu-item-is-topping">Là topping</Label>
          </div>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="isMainDish"
              render={({ field }) => (
                <Checkbox
                  id="menu-item-is-main-dish"
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value === true)}
                />
              )}
            />
            <Label htmlFor="menu-item-is-main-dish">Là món chính</Label>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Controller
              control={control}
              name="blockToday"
              render={({ field }) => (
                <Checkbox
                  id="menu-item-block-today"
                  checked={field.value}
                  disabled={!isMainDish}
                  onCheckedChange={(value) => field.onChange(value === true)}
                />
              )}
            />
            <Label htmlFor="menu-item-block-today">Không giao trong hôm nay</Label>
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <Label>Lý do chặn hôm nay</Label>
            <Input
              placeholder="Ví dụ: Món này chỉ bán ngày mai do hết nguyên liệu"
              disabled={!isMainDish}
              {...register('blockTodayReason')}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Danh sách ngày giao bị chặn</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => appendBlockedDateRule({ date: '', reason: '' })}
                disabled={!isMainDish}
              >
                Thêm ngày chặn
              </Button>
            </div>
            {!isMainDish ? (
              <p className="text-xs text-muted-foreground">
                Tính năng chặn ngày giao chỉ áp dụng cho món chính.
              </p>
            ) : null}
            {blockedDateRuleFields.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Chưa có ngày nào bị chặn.
              </p>
            ) : null}
            <div className="space-y-2">
              {blockedDateRuleFields.length > 0 ? (
                <div className="hidden grid-cols-[220px,1fr,96px] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
                  <p>Ngày chặn</p>
                  <p>Lý do</p>
                  <p className="text-right">Hành động</p>
                </div>
              ) : null}
              {blockedDateRuleFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-2 rounded-md border p-3 sm:grid-cols-[220px,1fr,96px]"
                >
                  <div>
                    <Controller
                      control={control}
                      name={`blockedDateRules.${index}.date`}
                      render={({ field: dateField }) => {
                        const selectedDate = parseBlockedDate(dateField.value ?? '');
                        return (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={!isMainDish}
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !dateField.value && 'text-muted-foreground',
                                )}
                              >
                                <CalendarDays className="mr-2 h-4 w-4" />
                                {selectedDate
                                  ? format(selectedDate, 'dd/MM/yyyy')
                                  : 'Chọn ngày'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) =>
                                  dateField.onChange(
                                    date ? format(date, 'yyyy-MM-dd') : '',
                                  )
                                }
                                disabled={{ before: new Date(1970, 0, 1) }}
                              />
                            </PopoverContent>
                          </Popover>
                        );
                      }}
                    />
                    {errors.blockedDateRules?.[index]?.date?.message ? (
                      <p className="mt-1 text-xs text-destructive">
                        {errors.blockedDateRules[index]?.date?.message}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <Input
                      placeholder="Lý do chặn ngày này"
                      disabled={!isMainDish}
                      {...register(`blockedDateRules.${index}.reason`)}
                    />
                    {errors.blockedDateRules?.[index]?.reason?.message ? (
                      <p className="mt-1 text-xs text-destructive">
                        {errors.blockedDateRules[index]?.reason?.message}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={!isMainDish}
                    onClick={() => removeBlockedDateRule(index)}
                  >
                    Xóa
                  </Button>
                </div>
              ))}
            </div>
            {hasRealtimeBlockedDateIssue ? (
              <p className="text-xs text-destructive">
                Cần nhập lý do cho các ngày: {missingReasonDates.join(', ')}
              </p>
            ) : null}
          </div>
        </form>

        <section className="mt-5 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Biến thể giá</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariant}
            >
              Thêm biến thể
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {variantFields.map((variant, index) => (
              <div
                key={variant.id}
                className="rounded-md border p-3"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Tên biến thể"
                    {...register(`variants.${index}.name`)}
                  />
                  <Controller
                    control={control}
                    name={`variants.${index}.price`}
                    render={({ field }) => (
                      <Input
                        placeholder="Giá (VND)"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(formatCurrencyInput(e.target.value))
                        }
                      />
                    )}
                  />
                </div>
                {errors.variants?.[index]?.name?.message ? (
                  <p className="mt-2 text-xs text-destructive">
                    {errors.variants[index]?.name?.message}
                  </p>
                ) : null}
                {errors.variants?.[index]?.price?.message ? (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.variants[index]?.price?.message}
                  </p>
                ) : null}
                <div className="mt-2 text-right">
                  <Button
                    type="button"
                    onClick={() => removeVariant(index)}
                    variant="destructive"
                    size="sm"
                  >
                    Xóa biến thể
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Hình ảnh / video</h3>
            <Button asChild type="button" variant="outline" size="sm">
              <Label className="cursor-pointer">
                <Input
                  className="hidden"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) =>
                    uploadFiles(Array.from(e.target.files ?? []))
                  }
                />
                {uploading ? 'Đang upload...' : 'Upload files'}
              </Label>
            </Button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {mediaFields.map((entry, index) => (
              <div
                key={`${entry.url}-${index}`}
                className="rounded-md border p-2"
              >
                {entry.type === 'image' ? (
                  <img
                    src={entry.url}
                    alt=""
                    className="aspect-video w-full rounded-md object-cover"
                  />
                ) : (
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex aspect-video w-full items-center justify-center rounded-md bg-muted text-sm text-muted-foreground"
                  >
                    Video media
                  </a>
                )}
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    onClick={() =>
                      setValue('thumbnailUrl', entry.url, {
                        shouldDirty: true,
                      })
                    }
                    variant="outline"
                    size="sm"
                  >
                    Đặt làm thumbnail
                  </Button>
                  <Button
                    type="button"
                    onClick={() => removeMedia(index)}
                    variant="destructive"
                    size="sm"
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {message ? (
          <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-foreground">
            {message}
          </p>
        ) : null}

        <DialogFooter className="mt-5">
          <Button type="button" onClick={onClose} variant="outline">
            Hủy
          </Button>
          <Button
            type="submit"
            form="menu-item-form"
            disabled={isSubmitting || uploading || hasRealtimeBlockedDateIssue}
          >
            {isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo món'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
