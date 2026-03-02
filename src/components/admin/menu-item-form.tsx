'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type CategoryOption = { id: string; name: string };
type MediaEntry = {
  type: 'image' | 'video';
  url: string;
  altText?: string | null;
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
  sort_order?: number;
  variants?: MenuVariant[];
  media?: { type: 'image' | 'video'; url: string; alt_text?: string | null }[];
};

type VariantForm = { name: string; price: string };

type Props = {
  open: boolean;
  categories: CategoryOption[];
  item?: MenuItemInput | null;
  onClose: () => void;
  onSaved?: (savedItem?: unknown) => void;
};

const EMPTY_VARIANT = { name: '', price: '' };
const DEFAULT_MENU_IMAGE = '/logo.png';

export function MenuItemForm({
  open,
  categories,
  item,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(item?.id);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [note, setNote] = useState('');
  const [preparationTimeMinutes, setPreparationTimeMinutes] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState(DEFAULT_MENU_IMAGE);
  const [isTopping, setIsTopping] = useState(false);
  const [sortOrder, setSortOrder] = useState('99');
  const [variants, setVariants] = useState<VariantForm[]>([EMPTY_VARIANT]);
  const [media, setMedia] = useState<MediaEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? '');
    setCategoryId(item?.category_id ?? categories[0]?.id ?? '');
    setDescription(item?.description ?? '');
    setIngredients(item?.ingredients ?? '');
    setNote(item?.note ?? '');
    setPreparationTimeMinutes(
      typeof item?.preparation_time_minutes === 'number'
        ? String(item.preparation_time_minutes)
        : '',
    );
    setThumbnailUrl(item?.thumbnail_url ?? DEFAULT_MENU_IMAGE);
    setIsTopping(Boolean(item?.is_topping));
    setSortOrder(String(item?.sort_order ?? 99));
    setMedia(
      (item?.media ?? []).map((entry) => ({
        type: entry.type,
        url: entry.url,
        altText: entry.alt_text ?? null,
      })),
    );
    const nextVariants = (item?.variants ?? []).map((entry) => ({
      name: entry.name ?? '',
      price: formatCurrencyInput(String(entry.price ?? '')),
    }));
    setVariants(nextVariants.length > 0 ? nextVariants : [EMPTY_VARIANT]);
    setMessage('');
  }, [open, item, categories]);

  const normalizedVariants = useMemo(
    () =>
      variants.map((entry) => ({
        name: entry.name.trim(),
        price: parseCurrencyInput(entry.price),
      })),
    [variants],
  );

  function addVariant() {
    setVariants((prev) => [...prev, EMPTY_VARIANT]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => {
      const next = prev.filter((_, current) => current !== index);
      return next.length > 0 ? next : [EMPTY_VARIANT];
    });
  }

  function updateVariant(index: number, next: VariantForm) {
    setVariants((prev) =>
      prev.map((entry, current) => (current === index ? next : entry)),
    );
  }

  function addUploadedEntries(entries: MediaEntry[]) {
    setMedia((prev) => [...prev, ...entries]);
    const firstImage = entries.find((entry) => entry.type === 'image');
    if (firstImage && (!thumbnailUrl || thumbnailUrl === DEFAULT_MENU_IMAGE)) {
      setThumbnailUrl(firstImage.url);
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
        setThumbnailUrl(firstImage.url);
        return;
      }
      addUploadedEntries(uploaded);
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!name.trim() || !categoryId) {
      setMessage('Vui lòng nhập tên món và chọn danh mục.');
      return;
    }
    if (normalizedVariants.some((entry) => !entry.name)) {
      setMessage('Tên biến thể không được để trống.');
      return;
    }
    if (
      normalizedVariants.some(
        (entry) => entry.price === null || (entry.price ?? -1) < 0,
      )
    ) {
      setMessage('Giá biến thể không hợp lệ.');
      return;
    }

    setSaving(true);
    setMessage('');
    const payload = {
      name: name.trim(),
      categoryId,
      description: description.trim() || null,
      ingredients: ingredients.trim() || null,
      note: note.trim() || null,
      preparationTimeMinutes: preparationTimeMinutes
        ? Math.max(0, Number(preparationTimeMinutes))
        : null,
      thumbnailUrl: thumbnailUrl.trim() || null,
      isTopping,
      sortOrder: Number(sortOrder || 0),
      variants: normalizedVariants.map((entry, index) => ({
        name: entry.name,
        price: Math.round(entry.price ?? 0),
        isDefault: index === 0,
      })),
      media: media.map((entry) => ({
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
    } finally {
      setSaving(false);
    }
  }

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

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1 sm:col-span-2">
            <Label>Tên món</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Danh mục</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
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
          </div>
          <div className="grid gap-1">
            <Label>Thứ tự hiển thị</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <Label>Mô tả</Label>
            <Textarea
              className="min-h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <Label>Nguyên liệu</Label>
            <Textarea
              className="min-h-20"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <Label>Note nhà hàng</Label>
            <Textarea
              className="min-h-16"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label>Thời gian chuẩn bị (phút)</Label>
            <Input
              type="number"
              value={preparationTimeMinutes}
              onChange={(e) => setPreparationTimeMinutes(e.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Thumbnail</Label>
            <div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
              <img
                src={thumbnailUrl || DEFAULT_MENU_IMAGE}
                alt="Thumbnail preview"
                className="h-20 w-20 rounded-md object-cover"
              />
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
                  onClick={() => setThumbnailUrl(DEFAULT_MENU_IMAGE)}
                  variant="outline"
                >
                  Dùng ảnh mặc định
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isTopping}
              onCheckedChange={(value) => setIsTopping(value === true)}
            />
            <Label>Là topping</Label>
          </div>
        </div>

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
            {variants.map((variant, index) => (
              <div
                key={`${index}-${variant.name}`}
                className="rounded-md border p-3"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Tên biến thể"
                    value={variant.name}
                    onChange={(e) =>
                      updateVariant(index, { ...variant, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Giá (VND)"
                    value={variant.price}
                    onChange={(e) =>
                      updateVariant(index, {
                        ...variant,
                        price: formatCurrencyInput(e.target.value),
                      })
                    }
                  />
                </div>
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
            {media.map((entry, index) => (
              <div
                key={`${entry.url}-${index}`}
                className="rounded-md border p-2"
              >
                {entry.type === 'image' ? (
                  <img
                    src={entry.url}
                    alt=""
                    className="h-28 w-full rounded-md object-cover"
                  />
                ) : (
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-28 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground"
                  >
                    Video media
                  </a>
                )}
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setThumbnailUrl(entry.url)}
                    variant="outline"
                    size="sm"
                  >
                    Đặt làm thumbnail
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      setMedia((prev) =>
                        prev.filter((_, current) => current !== index),
                      )
                    }
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
          <Button type="button" onClick={submit} disabled={saving || uploading}>
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo món'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
