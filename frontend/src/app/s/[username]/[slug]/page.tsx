import { getStoreSSR } from '@/lib/server-api';
import ApiDown from '@/components/ApiDown';
import StorePreview from '@/components/StorePreview';
import LaunchingSoon from '@/components/store/LaunchingSoon';
import VisitPing from '@/components/VisitPing';
import { withDefaults } from '@/lib/store-config';
import Link from 'next/link';
import { storeHref } from '@/lib/store-url';

export const dynamic = 'force-dynamic';

export default async function StoreCustomPage({ params, searchParams }: {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { username, slug } = await params;
  const preview = (await searchParams)?.preview;
  const store = await getStoreSSR(username, !!preview);
  if (!store) return <ApiDown what="This store" />;
  if (store.live === false && !preview) return <LaunchingSoon storeName={store.storeName} />;

  const config = withDefaults(store.storeName, store.storeConfig);
  const page = (config.pages || []).find((p) => p.slug === slug);

  if (!page) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-6 text-center">
        <div>
          <h1 className="font-display text-[24px] font-bold text-navy">Page not found</h1>
          <p className="mt-2 text-muted">This page doesn’t exist on {store.storeName}.</p>
          <Link href={storeHref(username)} className="btn-green mt-5 inline-flex">Back to store</Link>
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
