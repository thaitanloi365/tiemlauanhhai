'use client';

import { useMemo, useState } from 'react';
import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MenuItem as MenuItemCard } from '@/components/MenuItem';
import { MenuFilter, type MenuFilterState } from '@/components/MenuFilter';
import { MenuDrawer } from '@/components/MenuDrawer';
import { BottomNav } from '@/components/BottomNav';
import { FloatingContact } from '@/components/FloatingContact';
import { Button } from '@/components/ui/button';

type Props = {
  categories: AppTypes.Category[];
  menuItems: AppTypes.MenuItem[];
};

function matchesPrice(price: number, range: MenuFilterState['p']) {
  if (!range) return true;
  if (range === 'lt50') return price < 50_000;
  if (range === '50to100') return price >= 50_000 && price <= 100_000;
  if (range === '100to200') return price > 100_000 && price <= 200_000;
  return price > 200_000;
}

export function MenuPageClient({ categories, menuItems }: Props) {
  const [f] = useQueryStates({
    c: parseAsString.withDefault(''),
    p: parseAsStringEnum(['', 'lt50', '50to100', '100to200', 'gt200']).withDefault(
      '',
    ),
    o: parseAsStringEnum(['popular', 'price_asc', 'price_desc']).withDefault(
      'popular',
    ),
  });
  const mainCategories = useMemo(
    () => categories.filter((entry) => entry.slug === 'lau'),
    [categories],
  );

  const primaryCategory = mainCategories[0];
  const activeCategories = useMemo(
    () => (primaryCategory ? [primaryCategory] : categories),
    [categories, primaryCategory],
  );

  const menuItemsForMenuPage = useMemo(() => {
    if (!primaryCategory) return menuItems;
    return menuItems.filter((item) => item.category_id === primaryCategory.id);
  }, [menuItems, primaryCategory]);

  const [openDrawer, setOpenDrawer] = useState(false);
  const activeCategorySlug = f.c || primaryCategory?.slug || '';

  const categorySlugById = useMemo(
    () => new Map(activeCategories.map((entry) => [entry.id, entry.slug])),
    [activeCategories],
  );

  const filteredItems = useMemo(() => {
    const items = menuItemsForMenuPage.filter((item) => {
      const minPrice = Math.min(...item.variants.map((entry) => entry.price));
      const categorySlug = categorySlugById.get(item.category_id) || '';
      const categoryOk = !activeCategorySlug || categorySlug === activeCategorySlug;
      const priceOk = matchesPrice(minPrice, f.p);
      return categoryOk && priceOk;
    });

    return items.sort((a, b) => {
      if (f.o === 'price_asc') {
        const pa = Math.min(...a.variants.map((entry) => entry.price));
        const pb = Math.min(...b.variants.map((entry) => entry.price));
        return pa - pb;
      }
      if (f.o === 'price_desc') {
        const pa = Math.min(...a.variants.map((entry) => entry.price));
        const pb = Math.min(...b.variants.map((entry) => entry.price));
        return pb - pa;
      }
      return a.sort_order - b.sort_order;
    });
  }, [activeCategorySlug, categorySlugById, f.o, f.p, menuItemsForMenuPage]);

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
          categories={activeCategories.map((entry) => ({
            slug: entry.slug,
            name: entry.name,
          }))}
          showAllCategoryOption={false}
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
