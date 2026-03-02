import Link from 'next/link';
import { getMenuData } from '@/lib/server/menu';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MenuBook } from '@/components/MenuBook';
import { MenuItem } from '@/components/MenuItem';
import { BottomNav } from '@/components/BottomNav';
import { FloatingContact } from '@/components/FloatingContact';

export default async function HomePage() {
  const { categories, menuItems } = await getMenuData();
  const categoryById = new Map(categories.map((category) => [category.id, category.slug]));
  const featuredMainDishes = menuItems.filter((item) => {
    const slug = categoryById.get(item.category_id);
    return slug === 'lau' || slug === 'mon-chinh';
  });
  const featured = (featuredMainDishes.length > 0 ? featuredMainDishes : menuItems).slice(0, 6);

  return (
    <>
      <Header />
      <main className="container-shell py-8 md:py-12">
        <section className="grid gap-6 md:grid-cols-8 md:items-center">
          <div className="md:col-span-3">
            <h1 className="text-4xl font-semibold">Tiệm Lẩu Anh Hai</h1>
            <p className="mt-3 text-muted-foreground">
              Thực đơn lẩu và món ăn kèm cho bữa ăn gia đình tại nhà.
            </p>
            <div className="mt-5 flex gap-2">
              <Link href="/menu" className="btn-primary">
                Xem thực đơn
              </Link>
              <Link href="/orders" className="btn-secondary">
                Theo dõi đơn hàng
              </Link>
            </div>
          </div>
          <div className="md:col-span-5">
            <MenuBook />
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Món nổi bật</h2>
            <Link
              href="/menu"
              className="text-sm font-medium text-primary underline"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <FloatingContact />
      <BottomNav />
    </>
  );
}
