'use client';

import { useEffect } from 'react';
import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PRICE_OPTIONS = ['', 'lt50', '50to100', '100to200', 'gt200'] as const;
const SORT_OPTIONS = ['popular', 'price_asc', 'price_desc'] as const;

export type MenuFilterState = {
  category: string;
  price: (typeof PRICE_OPTIONS)[number];
  sort: (typeof SORT_OPTIONS)[number];
};

type Props = {
  categories: Array<{ slug: string; name: string }>;
  onChange?: (state: MenuFilterState) => void;
};

export function MenuFilter({ categories, onChange }: Props) {
  const [filters, setFilters] = useQueryStates({
    category: parseAsString.withDefault(''),
    price: parseAsStringEnum([...PRICE_OPTIONS]).withDefault(''),
    sort: parseAsStringEnum([...SORT_OPTIONS]).withDefault('popular'),
  });

  useEffect(() => {
    onChange?.(filters as MenuFilterState);
  }, [filters, onChange]);

  return (
    <div className="card-surface p-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="text-sm">
          <Label className="mb-1 block">Danh mục</Label>
          <Select
            value={filters.category || 'all'}
            onValueChange={(value) =>
              setFilters({ category: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.slug} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm">
          <Label className="mb-1 block">Mức giá</Label>
          <Select
            value={filters.price || 'all'}
            onValueChange={(value) =>
              setFilters({
                price: (value === 'all'
                  ? ''
                  : value) as MenuFilterState['price'],
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tất cả mức giá" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả mức giá</SelectItem>
              <SelectItem value="lt50">Dưới 50.000đ</SelectItem>
              <SelectItem value="50to100">50.000đ - 100.000đ</SelectItem>
              <SelectItem value="100to200">100.000đ - 200.000đ</SelectItem>
              <SelectItem value="gt200">Trên 200.000đ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm">
          <Label className="mb-1 block">Sắp xếp</Label>
          <Select
            value={filters.sort}
            onValueChange={(value) =>
              setFilters({ sort: value as MenuFilterState['sort'] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Phổ biến</SelectItem>
              <SelectItem value="price_asc">Giá thấp đến cao</SelectItem>
              <SelectItem value="price_desc">Giá cao đến thấp</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
