import { getStoreSSR } from '@/lib/server-api';
import ApiDown from '@/components/ApiDown';
import StorePreview from '@/components/StorePreview';
import LaunchingSoon from '@/components/store/LaunchingSoon';
import VisitPing from '@/components/VisitPing';
import { withDefaults } from '@/lib/store-config';

export const dynamic = 'force-dynamic';

export default async function StorePage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { username } = await params;
  const preview = (await searchParams)?.preview;
  // A seller previewing a draft must see the draft, not a cached visitor view.
  const store = await getStoreSSR(username, !!preview);
  if (!store) return <ApiDown what="This store" />;

  // Store isn't live until it's published AND has shipping + payout set up.
  if (store.live === false && !preview) return <LaunchingSoon storeName={store.storeName} />;

  // The storefront is ALWAYS rendered by the Store Editor system, so the public
  // page matches exactly what the seller sees (and previews) in the editor.
  // withDefaults() fills in a sensible default design when the seller hasn't
  // customized/published a config yet.
  const config = withDefaults(store.storeName, store.storeConfig || null, store.logoUrl);
  return (
    <main className="min-h-screen">
      <VisitPing username={username} />
      {/* No separate account strip — the store header carries wishlist/cart/account
          itself, and the announcement renders from StorePreview as designed. */}
      <StorePreview
        config={config}
        products={store.products}
        storeName={store.storeName}
        username={username}
        reviews={store.reviews || []}
        collections={store.collections || []}
      />
    </main>
  );
}
