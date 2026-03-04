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
  c: string;
  p: (typeof PRICE_OPTIONS)[number];
  o: (typeof SORT_OPTIONS)[number];
};

type Props = {
  categories: Array<{ slug: string; name: string }>;
  onChange?: (state: MenuFilterState) => void;
  showAllCategoryOption?: boolean;
};

export function MenuFilter({
  categories,
  onChange,
  showAllCategoryOption = true,
}: Props) {
  const [f, setF] = useQueryStates({
    c: parseAsString.withDefault(''),
    p: parseAsStringEnum([...PRICE_OPTIONS]).withDefault(''),
    o: parseAsStringEnum([...SORT_OPTIONS]).withDefault('popular'),
  });

  useEffect(() => {
    if (showAllCategoryOption || categories.length === 0) return;

    const onlyCategorySlug = categories[0].slug;
    if (f.c !== onlyCategorySlug) {
      void setF({ c: onlyCategorySlug });
    }
  }, [categories, f.c, setF, showAllCategoryOption]);

  useEffect(() => {
    onChange?.(f as MenuFilterState);
  }, [f, onChange]);

  return (
    <div className="card-surface p-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="text-sm">
          <Label className="mb-1 block">Danh mục</Label>
          <Select
            value={
              f.c ||
              (showAllCategoryOption ? 'all' : (categories[0]?.slug ?? ''))
            }
            onValueChange={(value) =>
              setF({
                c:
                  showAllCategoryOption && value === 'all' ? '' : value,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  showAllCategoryOption ? 'Tất cả' : (categories[0]?.name ?? '')
                }
              />
            </SelectTrigger>
            <SelectContent>
              {showAllCategoryOption ? (
                <SelectItem value="all">Tất cả</SelectItem>
              ) : null}
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
            value={f.p || 'all'}
            onValueChange={(value) =>
              setF({
                p: (value === 'all'
                  ? ''
                  : value) as MenuFilterState['p'],
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
            value={f.o}
            onValueChange={(value) =>
              setF({ o: value as MenuFilterState['o'] })
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
