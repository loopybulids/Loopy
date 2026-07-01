import { getStoreSSR } from '@/lib/server-api';
import ApiDown from '@/components/ApiDown';
import StorePreview from '@/components/StorePreview';
import VisitPing from '@/components/VisitPing';
import { withDefaults } from '@/lib/store-config';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function StoreCustomPage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params;
  const store = await getStoreSSR(username);
  if (!store) return <ApiDown what="This store" />;

  const config = withDefaults(store.storeName, store.storeConfig);
  const page = (config.pages || []).find((p) => p.slug === slug);

  if (!page) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-6 text-center">
        <div>
          <h1 className="font-display text-[24px] font-extrabold text-navy">Page not found</h1>
          <p className="mt-2 text-muted">This page doesn’t exist on {store.storeName}.</p>
          <Link href={`/s/${username}`} className="btn-green mt-5 inline-flex">Back to store</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <VisitPing username={username} />
      <StorePreview config={config} products={store.products} storeName={store.storeName} username={username} page={page} />
    </main>
  );
}
