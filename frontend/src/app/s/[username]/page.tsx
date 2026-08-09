import { getStoreSSR } from '@/lib/server-api';
import ApiDown from '@/components/ApiDown';
import StorePreview from '@/components/StorePreview';
import VisitPing from '@/components/VisitPing';
import { withDefaults } from '@/lib/store-config';

export const dynamic = 'force-dynamic';

export default async function StorePage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { username } = await params;
  const preview = (await searchParams)?.preview;
  const store = await getStoreSSR(username);
  if (!store) return <ApiDown what="This store" />;

  // Store isn't live until it's published AND has shipping + payout set up.
  if (store.live === false && !preview) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-6 text-center">
        <div>
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-green-soft text-3xl">🚀</div>
          <h1 className="font-display text-[26px] font-extrabold text-navy">{store.storeName} is launching soon</h1>
          <p className="mt-2 text-muted">This store isn’t open for orders just yet. Check back shortly!</p>
        </div>
      </main>
    );
  }

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
      <StorePreview config={config} products={store.products} storeName={store.storeName} username={username} />
    </main>
  );
}
