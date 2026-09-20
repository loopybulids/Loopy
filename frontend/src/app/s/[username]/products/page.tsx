import { getStoreSSR } from '@/lib/server-api';
import ApiDown from '@/components/ApiDown';
import StorePreview from '@/components/StorePreview';
import ProductCatalog from '@/components/store/ProductCatalog';
import LaunchingSoon from '@/components/store/LaunchingSoon';
import VisitPing from '@/components/VisitPing';
import { withDefaults } from '@/lib/store-config';
import Link from 'next/link';
import { storeHref } from '@/lib/store-url';

export const dynamic = 'force-dynamic';

/**
 * The full catalogue.
 *
 * Rendered inside StorePreview so it carries the seller's own header, footer,
 * fonts and accent colour — a shopper should not be able to tell that this
 * page and the home page were built differently.
 */
export default async function StoreProductsPage({ params, searchParams }: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { username } = await params;
  const preview = (await searchParams)?.preview;
  const store = await getStoreSSR(username, !!preview);
  if (!store) return <ApiDown what="This store" />;
  if (store.live === false && !preview) return <LaunchingSoon storeName={store.storeName} />;

  const config = withDefaults(store.storeName, store.storeConfig || null, store.logoUrl);
  const products = store.products || [];

  return (
    <main className="min-h-screen">
      <VisitPing username={username} />
      <StorePreview
        config={config}
        products={products}
        storeName={store.storeName}
        username={username}
        catalog
      >
        {products.length === 0 ? (
          <section className="px-5 py-20 text-center sm:px-8">
            <h1 className="font-display text-[24px] font-bold text-navy">No products yet</h1>
            <p className="mt-2 text-muted">{store.storeName} hasn’t listed anything for sale.</p>
            <Link href={storeHref(username)} className="btn-green mt-5 inline-flex">Back to store</Link>
          </section>
        ) : (
          <ProductCatalog products={products} username={username} accent={config.theme.accent} />
        )}
      </StorePreview>
    </main>
  );
}
