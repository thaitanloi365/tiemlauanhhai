import { getMenuData } from '@/lib/server/menu';
import { MenuPageClient } from '@/components/MenuPageClient';
import { Suspense } from 'react';

export default async function MenuPage() {
  const { categories, menuItems } = await getMenuData();
  return (
    <Suspense
      fallback={
        <main className="container-shell py-10">Đang tải thực đơn...</main>
      }
    >
      <MenuPageClient categories={categories} menuItems={menuItems} />
    </Suspense>
  );
}
