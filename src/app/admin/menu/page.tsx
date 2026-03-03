'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MenuItemForm } from '@/components/admin/menu-item-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Category = { id: string; name: string };
type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  thumbnail_url: string | null;
  is_available: boolean;
  is_topping: boolean;
  is_main_dish: boolean;
  block_today: boolean;
  block_today_reason: string | null;
  blocked_delivery_dates: string[];
  blocked_delivery_date_reasons: Record<string, string> | null;
  description?: string | null;
  ingredients?: string | null;
  note?: string | null;
  preparation_time_minutes?: number | null;
  sort_order?: number;
  variants?: Array<{ name: string; price: number }>;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    alt_text?: string | null;
  }>;
};

type MenuResponse = { items: MenuItem[]; categories: Category[] };
const DEFAULT_MENU_IMAGE = '/logo.png';

export default function AdminMenuPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<
    'all' | 'available' | 'hidden'
  >('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const menuQuery = useQuery({
    queryKey: ['admin', 'menu'],
    queryFn: async () => {
      const res = await fetch('/api/admin/menu', { cache: 'no-store' });
      const data = (await res.json()) as MenuResponse;
      if (!res.ok)
        throw new Error(
          (data as { message?: string }).message ?? 'Không tải được menu',
        );
      return data;
    },
  });

  const items = menuQuery.data?.items ?? [];
  const categories = menuQuery.data?.categories ?? [];

  const categoryNameMap = useMemo(
    () =>
      new Map<string, string>(
        categories.map((category) => [category.id, category.name]),
      ),
    [categories],
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch = item.name
          .toLowerCase()
          .includes(search.toLowerCase().trim());
        const matchesCategory =
          categoryFilter === 'all' || item.category_id === categoryFilter;
        const matchesAvailability =
          availabilityFilter === 'all' ||
          (availabilityFilter === 'available' && item.is_available) ||
          (availabilityFilter === 'hidden' && !item.is_available);
        return matchesSearch && matchesCategory && matchesAvailability;
      }),
    [items, search, categoryFilter, availabilityFilter],
  );

  async function toggleAvailable(item: MenuItem) {
    setSavingId(item.id);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/menu/${item.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          categoryId: item.category_id,
          name: item.name,
          description: item.description ?? null,
          ingredients: item.ingredients ?? null,
          note: item.note ?? null,
          preparationTimeMinutes: item.preparation_time_minutes ?? null,
          thumbnailUrl: item.thumbnail_url ?? DEFAULT_MENU_IMAGE,
          isAvailable: !item.is_available,
          isTopping: item.is_topping,
          isMainDish: item.is_main_dish,
          blockToday: item.block_today,
          blockTodayReason: item.block_today_reason,
          blockedDeliveryDates: item.blocked_delivery_dates ?? [],
          blockedDeliveryDateReasons: item.blocked_delivery_date_reasons ?? {},
          sortOrder: item.sort_order ?? 0,
          variants: (item.variants ?? []).map((variant, index) => ({
            name: variant.name,
            price: variant.price,
            isDefault: index === 0,
          })),
          media: (item.media ?? []).map((entry) => ({
            type: entry.type,
            url: entry.url,
            altText: entry.alt_text ?? null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? 'Không cập nhật được trạng thái');
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'menu'] });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="container-shell space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Quản lý menu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Thêm, chỉnh sửa món và quản lý trạng thái hiển thị.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setSelectedItem(null);
            setShowForm(true);
          }}
        >
          Thêm món mới
        </Button>
      </div>

      <div className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên món"
        />
        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={availabilityFilter}
          onValueChange={(value) =>
            setAvailabilityFilter(value as 'all' | 'available' | 'hidden')
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="available">Đang bán</SelectItem>
            <SelectItem value="hidden">Đang ẩn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {message ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-foreground">
          {message}
        </p>
      ) : null}

      <div className="rounded-md border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Danh sách món</h2>
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} món
          </p>
        </div>

        {menuQuery.isPending ? (
          <div className="mt-4 rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
            Đang tải dữ liệu...
          </div>
        ) : menuQuery.isError ? (
          <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-foreground">
            {menuQuery.error.message}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-4 rounded-xl bg-muted/60 px-3 py-4 text-sm text-muted-foreground">
            Không có món nào khớp bộ lọc.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-muted/30 p-3"
              >
                <div className="flex gap-3">
                  <div className="aspect-video w-32 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={item.thumbnail_url || DEFAULT_MENU_IMAGE}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.slug}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-muted px-2 py-1 text-foreground">
                        {categoryNameMap.get(item.category_id) ?? 'Danh mục'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 ${
                          item.is_available
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {item.is_available ? 'Đang bán' : 'Đang ẩn'}
                      </span>
                      {item.is_main_dish ? (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                          Món chính
                        </span>
                      ) : null}
                      {item.block_today ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                          Chặn hôm nay
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <div className="inline-flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={item.is_available}
                      disabled={savingId === item.id}
                      onCheckedChange={() => toggleAvailable(item)}
                    />
                    <Label>{item.is_available ? 'Đang bán' : 'Đang ẩn'}</Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowForm(true);
                    }}
                  >
                    Chỉnh sửa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MenuItemForm
        open={showForm}
        categories={categories}
        item={selectedItem}
        onClose={() => setShowForm(false)}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: ['admin', 'menu'] })
        }
      />
    </div>
  );
}
