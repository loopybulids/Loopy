/**
 * Shown instead of a storefront that isn't open yet.
 *
 * A store is live only once it is published AND has shipping and payouts set
 * up. Until then none of its pages may render — not the home page, not a
 * custom page, not the catalogue. Each route has to check for itself, because
 * a guard on the home page alone still leaves the others serving a seller's
 * unfinished shop to anyone who guesses the URL.
 *
 * `?preview=1` bypasses it, which is how the Store Editor shows a seller their
 * own work in progress.
 */
export default function LaunchingSoon({ storeName }: { storeName: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-green-soft text-3xl">🚀</div>
        <h1 className="font-display text-[26px] font-bold text-navy">{storeName} is launching soon</h1>
        <p className="mt-2 text-muted">This store isn’t open for orders just yet. Check back shortly!</p>
      </div>
    </main>
  );
}
