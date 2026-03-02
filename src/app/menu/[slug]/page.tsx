import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMenuItemBySlug } from '@/lib/server/menu';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MenuDetail } from '@/components/MenuDetail';
import { MenuItem } from '@/components/MenuItem';
import { BottomNav } from '@/components/BottomNav';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function MenuDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const { item, relatedItems } = await getMenuItemBySlug(slug);
  if (!item) return notFound();

  return (
    <>
      <Header />
      <main className="container-shell py-8">
        <Link href="/menu" className="text-sm text-primary hover:underline">
          ← Quay lại thực đơn
        </Link>
        <div className="mt-4">
          <MenuDetail item={item} />
        </div>
        {relatedItems.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-semibold">Món liên quan</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedItems.map((entry) => (
                <MenuItem key={entry.id} item={entry} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
