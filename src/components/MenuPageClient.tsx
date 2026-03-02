'use client';

import { useMemo, useState } from 'react';
import type { Category, MenuItem } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MenuItem as MenuItemCard } from '@/components/MenuItem';
import { MenuFilter, type MenuFilterState } from '@/components/MenuFilter';
import { MenuDrawer } from '@/components/MenuDrawer';
import { BottomNav } from '@/components/BottomNav';
import { FloatingContact } from '@/components/FloatingContact';
import { Button } from '@/components/ui/button';

type Props = {
  categories: Category[];
  menuItems: MenuItem[];
};

function matchesPrice(price: number, range: MenuFilterState['price']) {
  if (!range) return true;
  if (range === 'lt50') return price < 50_000;
  if (range === '50to100') return price >= 50_000 && price <= 100_000;
  if (range === '100to200') return price > 100_000 && price <= 200_000;
  return price > 200_000;
}

export function MenuPageClient({ categories, menuItems }: Props) {
  const [filters, setFilters] = useState<MenuFilterState>({
    category: '',
    price: '',
    sort: 'popular',
  });
  const [openDrawer, setOpenDrawer] = useState(false);

  const categorySlugById = useMemo(
    () => new Map(categories.map((entry) => [entry.id, entry.slug])),
    [categories],
  );

  const filteredItems = useMemo(() => {
    const items = menuItems.filter((item) => {
      const minPrice = Math.min(...item.variants.map((entry) => entry.price));
      const categorySlug = categorySlugById.get(item.category_id) || '';
      const categoryOk = !filters.category || categorySlug === filters.category;
      const priceOk = matchesPrice(minPrice, filters.price);
      return categoryOk && priceOk;
    });

    return items.sort((a, b) => {
      if (filters.sort === 'price_asc') {
        const pa = Math.min(...a.variants.map((entry) => entry.price));
        const pb = Math.min(...b.variants.map((entry) => entry.price));
        return pa - pb;
      }
      if (filters.sort === 'price_desc') {
        const pa = Math.min(...a.variants.map((entry) => entry.price));
        const pb = Math.min(...b.variants.map((entry) => entry.price));
        return pb - pa;
      }
      return a.sort_order - b.sort_order;
    });
  }, [menuItems, filters, categorySlugById]);

  return (
    <>
      <Header />
      <main className="container-shell py-8 md:py-10">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Thực đơn</h1>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpenDrawer(true)}
          >
            Mở menu nhanh
          </Button>
        </div>
        <MenuFilter
          categories={categories.map((entry) => ({
            slug: entry.slug,
            name: entry.name,
          }))}
          onChange={setFilters}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      </main>
      <Footer />
      <MenuDrawer open={openDrawer} onClose={() => setOpenDrawer(false)} />
      <FloatingContact />
      <BottomNav />
    </>
  );
}
